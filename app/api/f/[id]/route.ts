import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDownloadUrl } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transcription = await db.transcription.findUnique({
      where: { id },
      include: {
        chunks: {
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

    let audioUrl: string | null = null;
    if (transcription.fileKey) {
      try {
        audioUrl = await getDownloadUrl(transcription.fileKey);
      } catch (e) {
        console.error('Failed to generate audio URL:', e);
      }
    }

    const chunks = transcription.chunks.map((chunk: {
      id: string;
      chunkIndex: number;
      startTime: number;
      endTime: number;
      status: string;
      segments: unknown;
      correctedSegments: unknown;
      errorMessage: string | null;
      completedAt: Date | null;
    }) => ({
      id: chunk.id,
      index: chunk.chunkIndex,
      startTime: chunk.startTime,
      endTime: chunk.endTime,
      status: chunk.status,
      segments: chunk.segments,
      correctedSegments: chunk.correctedSegments,
      errorMessage: chunk.errorMessage,
      completedAt: chunk.completedAt,
    }));

    return NextResponse.json({
      id: transcription.id,
      fileName: transcription.fileName,
      fileSize: transcription.fileSize,
      duration: transcription.duration,
      status: transcription.status,
      chunkDurationSec: transcription.chunkDurationSec,
      totalChunks: transcription.totalChunks,
      chunks,
      errorMessage: transcription.errorMessage,
      createdAt: transcription.createdAt,
      completedAt: transcription.completedAt,
      audioUrl,
    });
  } catch (error) {
    console.error('Error fetching transcription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcription' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.chunkId && body.correctedSegments !== undefined) {
      const chunk = await db.transcriptionChunk.findUnique({
        where: { id: body.chunkId },
      });

      if (!chunk || chunk.transcriptionId !== id) {
        return NextResponse.json(
          { error: 'Chunk not found' },
          { status: 404 }
        );
      }

      await db.transcriptionChunk.update({
        where: { id: body.chunkId },
        data: {
          correctedSegments: body.correctedSegments,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating transcription:', error);
    return NextResponse.json(
      { error: 'Failed to update transcription' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transcription = await db.transcription.findUnique({
      where: { id },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      );
    }

    await db.transcription.update({
      where: { id },
      data: {
        status: 'FAILED',
        errorMessage: 'Cancelled by user',
      },
    });

    await db.transcriptionChunk.updateMany({
      where: {
        transcriptionId: id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      data: {
        status: 'FAILED',
        errorMessage: 'Cancelled by user',
      },
    });

    return NextResponse.json({ success: true, message: 'Transcription cancelled' });
  } catch (error) {
    console.error('Error cancelling transcription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel transcription' },
      { status: 500 }
    );
  }
}
