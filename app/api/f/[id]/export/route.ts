import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Word {
  word: string;
  start: number;
  end: number;
  probability: number;
}

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: Word[];
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatVttTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function segmentsToText(segments: Segment[]): string {
  return segments.map((s) => s.text).join('\n\n');
}

function segmentsToSrt(segments: Segment[]): string {
  return segments
    .map((segment, index) => {
      const startTime = formatTimestamp(segment.start);
      const endTime = formatTimestamp(segment.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}`;
    })
    .join('\n\n');
}

function segmentsToVtt(segments: Segment[]): string {
  const header = 'WEBVTT\n\n';
  const cues = segments
    .map((segment) => {
      const startTime = formatVttTimestamp(segment.start);
      const endTime = formatVttTimestamp(segment.end);
      return `${startTime} --> ${endTime}\n${segment.text}`;
    })
    .join('\n\n');
  return header + cues;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'txt';

    const transcription = await db.transcription.findUnique({
      where: { id },
      include: {
        chunks: {
          where: { status: 'COMPLETED' },
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      );
    }

    const allSegments: Segment[] = [];
    let segmentIdCounter = 0;

    for (const chunk of transcription.chunks) {
      const raw = chunk.correctedSegments || chunk.segments;
      if (!raw) continue;
      const chunkSegments = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).segments;
      if (!Array.isArray(chunkSegments)) continue;

      for (const segment of chunkSegments) {
        if (!segment || typeof segment !== 'object') continue;
        allSegments.push({
          id: segmentIdCounter++,
          start: Number(segment.start) || 0,
          end: Number(segment.end) || 0,
          text: String(segment.text ?? ''),
          words: Array.isArray(segment.words) ? segment.words : [],
        });
      }
    }

    if (allSegments.length === 0) {
      return NextResponse.json(
        { error: 'No transcription data available yet' },
        { status: 400 }
      );
    }

    let content: string;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'srt':
        content = segmentsToSrt(allSegments);
        contentType = 'application/x-subrip';
        fileExtension = 'srt';
        break;
      case 'vtt':
        content = segmentsToVtt(allSegments);
        contentType = 'text/vtt';
        fileExtension = 'vtt';
        break;
      case 'json':
        content = JSON.stringify(allSegments, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      case 'txt':
      default:
        content = segmentsToText(allSegments);
        contentType = 'text/plain';
        fileExtension = 'txt';
        break;
    }

    const fileName = (transcription.fileName || 'transcription').replace(/\.[^/.]+$/, '');
    const fullName = `${fileName}.${fileExtension}`;
    const asciiName = fullName.replace(/[^\x20-\x7E]/g, '_');
    const encodedName = encodeURIComponent(fullName);
    const headers = new Headers();
    headers.set('Content-Type', `${contentType}; charset=utf-8`);
    headers.set(
      'Content-Disposition',
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`
    );

    return new NextResponse(content, { headers });
  } catch (error) {
    console.error('Error exporting transcription:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to export transcription', detail: message },
      { status: 500 }
    );
  }
}
