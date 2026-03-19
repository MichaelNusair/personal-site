import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUploadUrl } from '@/lib/s3';

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/x-flv',
  'video/3gpp',
  'video/x-ms-wmv',
  'video/mpeg',
];

const ALLOWED_TYPES = [...ALLOWED_AUDIO_TYPES, ...ALLOWED_VIDEO_TYPES];

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

const DEFAULT_CHUNK_DURATION = 30;
const MIN_CHUNK_DURATION = 10;
const MAX_CHUNK_DURATION = 300;

function generateTranscriptionFileKey(
  transcriptionId: string,
  filename: string,
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `transcriptions/${transcriptionId}/${timestamp}-${sanitizedFilename}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fileName,
      fileSize,
      fileType,
      chunkDuration: chunkDurationStr,
    } = body;

    if (!fileName || !fileSize) {
      return NextResponse.json(
        { error: 'Missing file information' },
        { status: 400 },
      );
    }

    const isValidType = ALLOWED_TYPES.includes(fileType || '');
    const ext = fileName.split('.').pop()?.toLowerCase();
    const validExtensions = [
      'mp3',
      'wav',
      'webm',
      'ogg',
      'm4a',
      'mp4',
      'mov',
      'avi',
      'mkv',
      'flv',
      '3gp',
      'wmv',
      'mpeg',
      'mpg',
    ];

    if (!isValidType && (!ext || !validExtensions.includes(ext))) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Please upload an audio or video file (MP3, WAV, M4A, MP4, etc.)',
        },
        { status: 400 },
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2GB.' },
        { status: 400 },
      );
    }

    let chunkDurationSec = DEFAULT_CHUNK_DURATION;
    if (chunkDurationStr) {
      const parsed = parseInt(chunkDurationStr, 10);
      if (
        !isNaN(parsed) &&
        parsed >= MIN_CHUNK_DURATION &&
        parsed <= MAX_CHUNK_DURATION
      ) {
        chunkDurationSec = parsed;
      }
    }

    const transcription = await db.transcription.create({
      data: {
        fileName,
        fileKey: '',
        fileSize,
        status: 'PENDING',
        chunkDurationSec,
      },
    });

    const fileKey = generateTranscriptionFileKey(transcription.id, fileName);
    const contentType = fileType || 'application/octet-stream';
    const uploadUrl = await getUploadUrl(fileKey, contentType);

    await db.transcription.update({
      where: { id: transcription.id },
      data: { fileKey },
    });

    return NextResponse.json({
      id: transcription.id,
      uploadUrl,
      fileKey,
      chunkDurationSec,
    });
  } catch (error) {
    console.error('Error creating transcription:', error);
    return NextResponse.json(
      { error: 'Failed to create transcription' },
      { status: 500 },
    );
  }
}
