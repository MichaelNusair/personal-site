import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFileBuffer } from '@/lib/s3';
import { spawn } from 'child_process';
import { writeFile, unlink, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function getFfmpegPath(): string {
  try {
    return require('ffmpeg-static');
  } catch {
    return 'ffmpeg';
  }
}

function getFfprobePath(): string {
  const ffmpegPath = getFfmpegPath();
  if (ffmpegPath === 'ffmpeg') return 'ffprobe';
  return ffmpegPath.replace(/ffmpeg$/, 'ffprobe');
}

interface WhisperWord {
  word: string;
  start: number;
  end: number;
  probability: number;
}

interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
  words?: WhisperWord[];
}

interface WhisperVerboseResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getAzureConfig() {
  const baseEndpoint = requireEnv('AZURE_OPENAI_ENDPOINT');
  const deploymentName = requireEnv('AZURE_OPENAI_WHISPER_DEPLOYMENT');
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-06-01';
  const endpoint = `${baseEndpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/audio/transcriptions?api-version=${apiVersion}`;
  return { endpoint, apiKey: requireEnv('AZURE_OPENAI_API_KEY') };
}

async function extractAudioChunk(
  inputBuffer: Buffer,
  fileName: string,
  startTime: number,
  endTime: number,
): Promise<Buffer> {
  const tempId = randomUUID();
  const ext = fileName.split('.').pop()?.toLowerCase() || 'mp3';
  const inputPath = join(tmpdir(), `input-${tempId}.${ext}`);
  const outputPath = join(tmpdir(), `output-${tempId}.mp3`);

  try {
    await writeFile(inputPath, inputBuffer);

    await new Promise<void>((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-ss', startTime.toString(),
        '-to', endTime.toString(),
        '-vn',
        '-acodec', 'libmp3lame',
        '-ar', '16000',
        '-ac', '1',
        '-b:a', '64k',
        '-y',
        outputPath,
      ];

      const ffmpeg = spawn(getFfmpegPath(), args);
      let stderr = '';
      ffmpeg.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
      ffmpeg.on('close', (code: number | null) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      });
      ffmpeg.on('error', (err: Error) => reject(new Error(`ffmpeg error: ${err.message}`)));
    });

    return await readFile(outputPath);
  } finally {
    try { await unlink(inputPath); } catch {}
    try { await unlink(outputPath); } catch {}
  }
}

async function getAudioDuration(buffer: Buffer, fileName: string): Promise<number> {
  const tempId = randomUUID();
  const ext = fileName.split('.').pop()?.toLowerCase() || 'mp3';
  const inputPath = join(tmpdir(), `probe-${tempId}.${ext}`);

  try {
    await writeFile(inputPath, buffer);
    return new Promise<number>((resolve) => {
      const args = ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', inputPath];
      const ffprobe = spawn(getFfprobePath(), args);
      let stdout = '';
      ffprobe.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
      ffprobe.on('close', (code: number | null) => {
        if (code === 0) {
          const duration = parseFloat(stdout.trim());
          resolve(isNaN(duration) ? 0 : duration);
        } else {
          resolve(0);
        }
      });
      ffprobe.on('error', () => resolve(0));
    });
  } finally {
    try { await unlink(inputPath); } catch {}
  }
}

const WHISPER_MAX_RETRIES = 5;
const WHISPER_INITIAL_DELAY_MS = 1000;
const WHISPER_MAX_DELAY_MS = 60000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function transcribeWithWhisper(audioBuffer: Buffer, fileName: string): Promise<WhisperVerboseResponse> {
  const config = getAzureConfig();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < WHISPER_MAX_RETRIES; attempt++) {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' });
    formData.append('file', blob, fileName.replace(/\.[^/.]+$/, '.mp3'));
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');
    formData.append('timestamp_granularities[]', 'word');

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'api-key': config.apiKey },
      body: formData,
    });

    const responseText = await response.text();

    if (response.ok) {
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from transcription service');
      }
      let result: WhisperVerboseResponse;
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse Whisper response:', responseText);
        throw new Error('Invalid response from transcription service');
      }
      return result;
    }

    if (response.status === 429 || response.status >= 500) {
      const retryAfter = response.headers.get('Retry-After');
      let delayMs: number;
      if (retryAfter) {
        const retrySeconds = parseInt(retryAfter, 10);
        delayMs = !isNaN(retrySeconds)
          ? retrySeconds * 1000
          : Math.max(0, new Date(retryAfter).getTime() - Date.now());
      } else {
        delayMs = Math.min(WHISPER_INITIAL_DELAY_MS * Math.pow(2, attempt), WHISPER_MAX_DELAY_MS);
      }
      console.warn(`Whisper API ${response.status}, attempt ${attempt + 1}/${WHISPER_MAX_RETRIES}, retrying in ${delayMs}ms`);
      lastError = new Error(`Transcription failed: ${response.status} - ${responseText}`);
      await sleep(delayMs);
      continue;
    }

    throw new Error(`Transcription failed: ${response.status} - ${responseText}`);
  }

  throw lastError || new Error('Transcription failed after max retries');
}

async function updateTranscriptionStatus(transcriptionId: string): Promise<void> {
  const chunks = await db.transcriptionChunk.findMany({
    where: { transcriptionId },
    orderBy: { chunkIndex: 'asc' },
  });

  const allCompleted = chunks.every((c) => c.status === 'COMPLETED');
  const anyFailed = chunks.some((c) => c.status === 'FAILED');
  const anyProcessing = chunks.some((c) => c.status === 'PROCESSING' || c.status === 'PENDING');

  let newStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  if (allCompleted) newStatus = 'COMPLETED';
  else if (anyFailed && !anyProcessing) newStatus = 'FAILED';
  else newStatus = 'PROCESSING';

  await db.transcription.update({
    where: { id: transcriptionId },
    data: {
      status: newStatus,
      completedAt: newStatus === 'COMPLETED' ? new Date() : null,
    },
  });
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-api-secret');
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { transcriptionId, chunkIndex, fileKey, startTime, endTime } = body;

  if (!transcriptionId || chunkIndex === undefined || !fileKey) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Return immediately, process in background
  const processPromise = processChunk(transcriptionId, chunkIndex, fileKey, startTime, endTime);
  processPromise.catch((err) => console.error(`Chunk ${chunkIndex} processing failed:`, err));

  return NextResponse.json({ status: 'processing' });
}

async function processChunk(
  transcriptionId: string,
  chunkIndex: number,
  fileKey: string,
  startTime: number,
  endTime: number,
): Promise<void> {
  console.log(`Processing chunk ${chunkIndex} for transcription ${transcriptionId}`);

  try {
    const chunk = await db.transcriptionChunk.findUnique({
      where: { transcriptionId_chunkIndex: { transcriptionId, chunkIndex } },
      include: { transcription: true },
    });

    if (!chunk) {
      console.error(`Chunk ${chunkIndex} for transcription ${transcriptionId} not found`);
      return;
    }

    await db.transcriptionChunk.update({
      where: { id: chunk.id },
      data: { status: 'PROCESSING' },
    });

    console.log(`Fetching audio from S3: ${fileKey}`);
    const fullAudioBuffer = await getFileBuffer(fileKey);
    console.log(`Audio file size: ${fullAudioBuffer.length} bytes`);

    let audioToTranscribe: Buffer;
    let timeOffset = 0;

    if (startTime > 0 || endTime > 0) {
      console.log(`Extracting chunk from ${startTime}s to ${endTime}s`);
      audioToTranscribe = await extractAudioChunk(fullAudioBuffer, chunk.transcription.fileName, startTime, endTime);
      timeOffset = startTime;
      console.log(`Extracted chunk size: ${audioToTranscribe.length} bytes`);
    } else {
      audioToTranscribe = fullAudioBuffer;
      if (!chunk.transcription.duration) {
        const duration = await getAudioDuration(fullAudioBuffer, chunk.transcription.fileName);
        if (duration > 0) {
          await db.transcription.update({
            where: { id: transcriptionId },
            data: { duration: Math.round(duration) },
          });
          await db.transcriptionChunk.update({
            where: { id: chunk.id },
            data: { endTime: duration },
          });
        }
      }
    }

    console.log('Starting Whisper transcription...');
    const whisperResult = await transcribeWithWhisper(audioToTranscribe, chunk.transcription.fileName);
    const segments = whisperResult.segments || [];
    console.log(`Transcription complete: ${segments.length} segments, duration: ${whisperResult.duration}s`);

    const transformedSegments = segments.map((segment, idx) => ({
      id: idx,
      start: segment.start + timeOffset,
      end: segment.end + timeOffset,
      text: segment.text.trim(),
      words: segment.words?.map((word) => ({
        word: word.word,
        start: word.start + timeOffset,
        end: word.end + timeOffset,
        probability: word.probability,
      })) || [],
    }));

    await db.transcriptionChunk.update({
      where: { id: chunk.id },
      data: {
        status: 'COMPLETED',
        segments: transformedSegments,
        completedAt: new Date(),
        errorMessage: null,
      },
    });

    await updateTranscriptionStatus(transcriptionId);
    console.log(`Chunk ${chunkIndex} completed`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error processing chunk ${chunkIndex}:`, error);

    await db.transcriptionChunk.update({
      where: { transcriptionId_chunkIndex: { transcriptionId, chunkIndex } },
      data: { status: 'FAILED', errorMessage: errorMessage.substring(0, 2000) },
    });

    await updateTranscriptionStatus(transcriptionId);
  }
}
