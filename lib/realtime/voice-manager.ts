export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'disconnected'
  | 'reconnecting'
  | 'error'
  | 'permission_denied';

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  final: boolean;
}

export interface ToolCallPayload {
  name: string;
  arguments: string;
  call_id: string;
}

export interface SessionConfig {
  ephemeralKey: string;
  azureEndpoint: string;
}

export type StateChangeCallback = (state: ConnectionState) => void;
export type TranscriptCallback = (entry: TranscriptEntry) => void;
export type ToolCallCallback = (payload: ToolCallPayload) => void;

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;

export class VoiceManager {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private state: ConnectionState = 'idle';
  private reconnectAttempts = 0;
  private sessionConfig: SessionConfig | null = null;
  private startTime = 0;
  private isMuted = false;

  private currentUserTranscript = '';
  private currentAssistantTranscript = '';

  private onStateChange: StateChangeCallback;
  private onToolCall: ToolCallCallback;
  private onTranscript: TranscriptCallback;

  constructor(
    onStateChange: StateChangeCallback,
    onToolCall: ToolCallCallback,
    onTranscript: TranscriptCallback,
  ) {
    this.onStateChange = onStateChange;
    this.onToolCall = onToolCall;
    this.onTranscript = onTranscript;
  }

  getState(): ConnectionState {
    return this.state;
  }

  getDurationSeconds(): number {
    if (this.startTime === 0) return 0;
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  isMutedState(): boolean {
    return this.isMuted;
  }

  private setState(newState: ConnectionState): void {
    this.state = newState;
    this.onStateChange(newState);
  }

  async requestMicPermission(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.setState('permission_denied');
      throw new Error('Microphone permission denied');
    }
  }

  async connect(config: SessionConfig): Promise<void> {
    this.sessionConfig = config;
    this.setState('connecting');
    this.startTime = Date.now();
    this.reconnectAttempts = 0;

    try {
      this.localStream = await this.requestMicPermission();
      await this.establishConnection(config);
    } catch (err) {
      if (this.state !== 'permission_denied') {
        this.setState('error');
      }
      throw err;
    }
  }

  private async establishConnection(config: SessionConfig): Promise<void> {
    this.pc = new RTCPeerConnection();

    this.remoteAudio = document.createElement('audio');
    this.remoteAudio.autoplay = true;

    this.pc.ontrack = (ev) => {
      if (this.remoteAudio && ev.streams[0]) {
        this.remoteAudio.srcObject = ev.streams[0];
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });
    }

    this.dc = this.pc.createDataChannel('realtime-channel');
    this.setupDataChannel();

    this.pc.onconnectionstatechange = () => {
      const connState = this.pc?.connectionState;
      if (connState === 'connected') {
        this.setState('connected');
      } else if (connState === 'disconnected' || connState === 'failed') {
        this.handleDisconnect();
      }
    };

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const webrtcUrl = `${config.azureEndpoint}/openai/v1/realtime/calls`;

    const resp = await fetch(webrtcUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.ephemeralKey}`,
        'Content-Type': 'application/sdp',
      },
      body: offer.sdp,
    });

    if (!resp.ok) {
      throw new Error(`WebRTC signaling failed: ${resp.status}`);
    }

    const answerSdp = await resp.text();
    await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  }

  private setupDataChannel(): void {
    if (!this.dc) return;

    this.dc.onopen = () => {
      this.setState('connected');
    };

    this.dc.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data);
        this.handleRealtimeEvent(event);
      } catch {
        // Ignore malformed messages
      }
    };

    this.dc.onclose = () => {
      this.handleDisconnect();
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleRealtimeEvent(event: any): void {
    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        this.currentUserTranscript = '';
        this.setState('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        this.setState('connected');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          this.currentUserTranscript = event.transcript;
          this.onTranscript({
            role: 'user',
            text: event.transcript,
            timestamp: Date.now(),
            final: true,
          });
        }
        break;

      case 'response.audio_transcript.delta':
        if (event.delta) {
          this.currentAssistantTranscript += event.delta;
          this.onTranscript({
            role: 'assistant',
            text: this.currentAssistantTranscript,
            timestamp: Date.now(),
            final: false,
          });
        }
        if (this.state !== 'speaking') {
          this.setState('speaking');
        }
        break;

      case 'response.audio_transcript.done':
        if (this.currentAssistantTranscript) {
          this.onTranscript({
            role: 'assistant',
            text: event.transcript || this.currentAssistantTranscript,
            timestamp: Date.now(),
            final: true,
          });
        }
        this.currentAssistantTranscript = '';
        break;

      case 'response.audio.delta':
        if (this.state !== 'speaking') {
          this.setState('speaking');
        }
        break;

      case 'response.audio.done':
      case 'response.done':
        if (this.state === 'speaking') {
          this.setState('connected');
        }
        break;

      case 'response.function_call_arguments.done': {
        const item = event.item;
        if (item) {
          this.onToolCall({
            name: item.name,
            arguments: item.arguments,
            call_id: item.call_id,
          });
        }
        break;
      }
    }
  }

  sendToolResult(callId: string, result: string): void {
    if (!this.dc || this.dc.readyState !== 'open') return;

    this.dc.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: result,
        },
      }),
    );

    this.dc.send(JSON.stringify({ type: 'response.create' }));
  }

  private handleDisconnect(): void {
    if (this.state === 'disconnected' || this.state === 'idle') return;

    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS && this.sessionConfig) {
      this.reconnectAttempts++;
      this.setState('reconnecting');

      setTimeout(async () => {
        try {
          this.cleanupConnection();
          await this.establishConnection(this.sessionConfig!);
        } catch {
          this.handleDisconnect();
        }
      }, RECONNECT_DELAY_MS);
    } else {
      this.setState('disconnected');
    }
  }

  toggleMute(): boolean {
    if (!this.localStream) return this.isMuted;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });
    return this.isMuted;
  }

  disconnect(): void {
    this.cleanupConnection();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.setState('disconnected');
  }

  private cleanupConnection(): void {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.remoteAudio) {
      this.remoteAudio.srcObject = null;
      this.remoteAudio = null;
    }
  }

  destroy(): void {
    this.disconnect();
    this.sessionConfig = null;
    this.startTime = 0;
  }
}
