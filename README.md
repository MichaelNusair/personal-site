# Transcriptions (michaelnusair.tech)

Standalone internal tools extracted from GetVL. Deployed to `michaelnusair.tech`.

## Features

- **Transcription** (`/f`) -- Upload audio/video files, transcribe via Azure OpenAI Whisper
- **Realtime Playground** (`/realtime`) -- Voice AI demo using Azure OpenAI Realtime API
- **Fun** (`/fun`) -- Easter eggs and novelty pages

## Architecture

- **Next.js** app with API routes
- **Transcription Worker** -- Lambda function processing SQS messages for chunked transcription
- **PostgreSQL** database (separate from GetVL) for Transcription/TranscriptionChunk models
- **AWS S3** for file storage
- **AWS SQS** for async transcription job queue

## Development

```bash
npm install
npx prisma generate
npm run dev
```

## Deployment

Deployed via AWS CDK to `michaelnusair.tech`. See `infra/` for stack definitions.
