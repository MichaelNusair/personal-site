import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { transcriptionId, estimatedDuration } = await request.json();

    if (!transcriptionId) {
      return NextResponse.json(
        { error: 'Transcription ID is required' },
        { status: 400 }
      );
    }

    const transcription = await db.transcription.findUnique({
      where: { id: transcriptionId },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      );
    }

    if (transcription.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Transcription already processing or completed' },
        { status: 400 }
      );
    }

    const duration = estimatedDuration || 0;
    const chunkDuration = transcription.chunkDurationSec;

    let totalChunks = 1;
    const chunks: { chunkIndex: number; startTime: number; endTime: number }[] = [];

    if (duration > 0) {
      totalChunks = Math.ceil(duration / chunkDuration);
      for (let i = 0; i < totalChunks; i++) {
        const startTime = i * chunkDuration;
        const endTime = Math.min((i + 1) * chunkDuration, duration);
        chunks.push({ chunkIndex: i, startTime, endTime });
      }
    } else {
      chunks.push({ chunkIndex: 0, startTime: 0, endTime: 0 });
    }

    await db.transcription.update({
      where: { id: transcriptionId },
      data: {
        status: 'PROCESSING',
        duration: duration > 0 ? Math.round(duration) : null,
        totalChunks,
      },
    });

    const createdChunks = await Promise.all(
      chunks.map((chunk) =>
        db.transcriptionChunk.create({
          data: {
            transcriptionId,
            chunkIndex: chunk.chunkIndex,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            status: 'PENDING',
          },
        })
      )
    );

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    for (const chunk of createdChunks) {
      fetch(`${baseUrl}/api/f/process-chunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': process.env.NEXTAUTH_SECRET || '' },
        body: JSON.stringify({
          transcriptionId: transcription.id,
          chunkIndex: chunk.chunkIndex,
          fileKey: transcription.fileKey,
          startTime: chunk.startTime,
          endTime: chunk.endTime,
        }),
      }).catch(err => console.error(`Failed to trigger chunk ${chunk.chunkIndex}:`, err));
    }

    return NextResponse.json({
      success: true,
      totalChunks,
      chunks: chunks.map((c) => ({
        index: c.chunkIndex,
        startTime: c.startTime,
        endTime: c.endTime,
      })),
    });
  } catch (error) {
    console.error('Error confirming transcription upload:', error);
    return NextResponse.json(
      { error: 'Failed to start transcription' },
      { status: 500 }
    );
  }
}
