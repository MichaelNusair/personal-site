/**
 * Transcription Worker - SQS Lambda Handler
 *
 * TODO: Copy the full implementation from the GetVL repo:
 *   Sources:
 *     - apps/worker/src/transcription-index.ts (Lambda SQS handler entry point)
 *     - apps/worker/src/transcription-handler.ts (core logic)
 *     - apps/worker/Dockerfile.transcription (Docker image with ffmpeg)
 *
 * This worker:
 * 1. Receives SQS messages with transcription chunk jobs
 * 2. Downloads the source file from S3
 * 3. Extracts audio chunks with ffmpeg
 * 4. Sends chunks to Azure OpenAI Whisper for transcription
 * 5. Updates the database with results
 */

import { SQSEvent } from 'aws-lambda';

export async function handler(event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    console.log('Processing transcription chunk:', body);
    // TODO: Implement transcription processing
  }
}
