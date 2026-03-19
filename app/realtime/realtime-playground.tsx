'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import {
  VoiceManager,
  type ConnectionState,
  type TranscriptEntry,
  type ToolCallPayload,
} from '@/lib/realtime/voice-manager';
import { handleToolCall, type ToolCallResult, type ToolEvent } from '@/lib/realtime/tools';
import type { MockProduct } from '@/lib/realtime/mock-store';

interface Props {
  userEmail: string;
}

const STATE_CONFIG: Record<ConnectionState, { label: string; color: string; dotColor: string }> = {
  idle: { label: 'Ready', color: 'text-neutral-400', dotColor: 'bg-neutral-400' },
  connecting: { label: 'Connecting...', color: 'text-yellow-400', dotColor: 'bg-yellow-400' },
  connected: { label: 'Connected', color: 'text-green-400', dotColor: 'bg-green-400' },
  listening: { label: 'Listening...', color: 'text-blue-400', dotColor: 'bg-blue-400' },
  speaking: { label: 'Speaking...', color: 'text-indigo-400', dotColor: 'bg-indigo-400' },
  disconnected: { label: 'Disconnected', color: 'text-neutral-500', dotColor: 'bg-neutral-500' },
  reconnecting: { label: 'Reconnecting...', color: 'text-yellow-400', dotColor: 'bg-yellow-400' },
  error: { label: 'Error', color: 'text-red-400', dotColor: 'bg-red-400' },
  permission_denied: { label: 'Mic Denied', color: 'text-red-400', dotColor: 'bg-red-400' },
};

export function RealtimePlayground({ userEmail }: Props) {
  const [state, setState] = useState<ConnectionState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallResult[]>([]);
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'tools'>('transcript');

  const voiceManagerRef = useRef<VoiceManager | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const toolsEndRef = useRef<HTMLDivElement>(null);

  const onStateChange = useCallback((newState: ConnectionState) => {
    setState(newState);
  }, []);

  const onTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscripts((prev) => {
      if (!entry.final) {
        const lastIdx = prev.length - 1;
        if (lastIdx >= 0 && prev[lastIdx].role === entry.role && !prev[lastIdx].final) {
          const updated = [...prev];
          updated[lastIdx] = entry;
          return updated;
        }
      }
      if (entry.final) {
        const lastIdx = prev.length - 1;
        if (lastIdx >= 0 && prev[lastIdx].role === entry.role && !prev[lastIdx].final) {
          const updated = [...prev];
          updated[lastIdx] = entry;
          return updated;
        }
      }
      return [...prev, entry];
    });
  }, []);

  const onToolCall = useCallback((payload: ToolCallPayload) => {
    const { result, event } = handleToolCall(payload.name, payload.arguments);

    setToolCalls((prev) => [
      ...prev,
      {
        name: payload.name,
        args: JSON.parse(payload.arguments),
        result,
        timestamp: Date.now(),
      },
    ]);

    setToolEvents((prev) => [...prev, event]);

    voiceManagerRef.current?.sendToolResult(payload.call_id, result);
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  useEffect(() => {
    toolsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [toolCalls]);

  useEffect(() => {
    return () => {
      voiceManagerRef.current?.destroy();
    };
  }, []);

  const handleStart = async () => {
    setError(null);
    setState('connecting');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const resp = await fetch(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/realtime/session`, {
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error((data as { error?: string }).error || `Session failed (${resp.status})`);
      }

      const ephemeralKey = (data as { ephemeralKey?: string }).ephemeralKey;
      const azureEndpoint = (data as { azureEndpoint?: string }).azureEndpoint;
      if (!ephemeralKey || !azureEndpoint) {
        throw new Error('Invalid session response');
      }

      const vm = new VoiceManager(onStateChange, onToolCall, onTranscript);
      voiceManagerRef.current = vm;

      await vm.connect({ ephemeralKey, azureEndpoint });
    } catch (err) {
      let message = 'Connection failed';
      if (err instanceof Error) {
        if (err.name === 'AbortError') message = 'Request timed out. Try again.';
        else if (err.message === 'Failed to fetch')
          message = 'Could not reach the server. Check your connection or try again in a moment.';
        else message = err.message;
      }
      setError(message);
      setState('error');
    }
  };

  const handleStop = () => {
    voiceManagerRef.current?.disconnect();
    voiceManagerRef.current = null;
  };

  const handleToggleMute = () => {
    const muted = voiceManagerRef.current?.toggleMute();
    if (muted !== undefined) setIsMuted(muted);
  };

  const isActive = !['idle', 'disconnected', 'error', 'permission_denied'].includes(state);
  const stateInfo = STATE_CONFIG[state];

  const searchProducts = toolEvents
    .filter((e): e is Extract<ToolEvent, { type: 'search' }> => e.type === 'search')
    .flatMap((e) => e.data.products);

  const latestProducts = searchProducts.length > 0
    ? searchProducts.slice(-10)
    : [];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold">TalkPilot Playground</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{userEmail}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/realtime' })}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8 min-h-0">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${stateInfo.dotColor} ${state === 'listening' || state === 'speaking' || state === 'connecting' || state === 'reconnecting' ? 'animate-pulse' : ''}`} />
          <span className={`text-sm font-medium ${stateInfo.color}`}>{stateInfo.label}</span>
        </div>

        {/* Mic button */}
        <div className="relative">
          {/* Animated rings */}
          {(state === 'listening' || state === 'speaking') && (
            <>
              <div className={`absolute inset-0 rounded-full ${state === 'listening' ? 'bg-blue-500/20' : 'bg-indigo-500/20'} animate-ping`} style={{ animationDuration: '1.5s' }} />
              <div className={`absolute -inset-4 rounded-full ${state === 'listening' ? 'bg-blue-500/10' : 'bg-indigo-500/10'} animate-ping`} style={{ animationDuration: '2s' }} />
            </>
          )}

          <button
            onClick={isActive ? handleStop : handleStart}
            disabled={state === 'connecting' || state === 'reconnecting'}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive
                ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25'
            }`}
          >
            {isActive ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        </div>

        {/* Mute button (shown when active) */}
        {isActive && (
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isMuted
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {isMuted ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 max-w-md text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Product cards from search results */}
        {latestProducts.length > 0 && (
          <div className="w-full max-w-3xl">
            <h3 className="text-sm font-medium text-neutral-400 mb-3">Search Results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {latestProducts.map((product: MockProduct) => (
                <div key={product.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-white truncate">{product.name}</h4>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-semibold text-indigo-400">${product.price}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${product.inStock ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom panel: Transcript + Tools */}
        <div className="w-full max-w-3xl flex-1 min-h-0 flex flex-col">
          {/* Tab headers */}
          <div className="flex gap-1 bg-neutral-900 rounded-t-lg p-1 shrink-0">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'transcript'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Transcript
              {transcripts.length > 0 && (
                <span className="ml-2 text-xs text-neutral-500">({transcripts.filter((t) => t.final).length})</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex-1 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'tools'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Tool Calls
              {toolCalls.length > 0 && (
                <span className="ml-2 text-xs text-neutral-500">({toolCalls.length})</span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 bg-neutral-900 rounded-b-lg border border-neutral-800 border-t-0 overflow-y-auto p-4" style={{ maxHeight: '300px' }}>
            {activeTab === 'transcript' ? (
              <div className="space-y-3">
                {transcripts.length === 0 ? (
                  <p className="text-neutral-500 text-sm text-center py-8">
                    {isActive ? 'Waiting for conversation...' : 'Start a session to see the transcript.'}
                  </p>
                ) : (
                  transcripts.filter((t) => t.final).map((entry, i) => (
                    <div key={i} className={`flex gap-3 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        entry.role === 'user'
                          ? 'bg-indigo-600/20 text-indigo-200'
                          : 'bg-neutral-800 text-neutral-200'
                      }`}>
                        <span className="text-xs font-medium block mb-1 opacity-60">
                          {entry.role === 'user' ? 'You' : 'Assistant'}
                        </span>
                        {entry.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            ) : (
              <div className="space-y-3">
                {toolCalls.length === 0 ? (
                  <p className="text-neutral-500 text-sm text-center py-8">
                    No tool calls yet.
                  </p>
                ) : (
                  toolCalls.map((tc, i) => (
                    <div key={i} className="bg-neutral-800 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-indigo-400 font-medium">{tc.name}</span>
                        <span className="text-xs text-neutral-500">
                          {new Date(tc.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-xs text-neutral-500">Args: </span>
                          <code className="text-xs text-neutral-300">{JSON.stringify(tc.args)}</code>
                        </div>
                        <div>
                          <span className="text-xs text-neutral-500">Result: </span>
                          <code className="text-xs text-green-400">{tc.result.slice(0, 200)}</code>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={toolsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
