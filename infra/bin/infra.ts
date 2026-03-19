/**
 * AWS CDK Infrastructure for Internal Tools (michaelnusair.tech)
 *
 * Stacks:
 * - InternalToolsStack: Next.js app on Lambda + CloudFront, Route53 for michaelnusair.tech
 * - InternalToolsWorkerStack: Transcription worker Lambda + SQS queue
 * - InternalToolsDbStack: RDS PostgreSQL for Transcription data (or shared with GetVL)
 *
 * TODO: Implement CDK stacks. Reference the GetVL infra for patterns:
 *   - infra/lib/hosting-stack.ts (Next.js on Lambda + CloudFront pattern)
 *   - infra/lib/compute-stack.ts (Lambda worker + SQS pattern)
 *   - infra/lib/storage-stack.ts (S3 + SQS pattern)
 *
 * Key differences from GetVL:
 * - Single domain (michaelnusair.tech), no multi-tenancy
 * - No wildcard SSL cert needed
 * - Simpler deployment (no tenant routing)
 * - Own database with only Transcription/TranscriptionChunk models
 * - Reuses the same AWS account
 */

import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();

// TODO: Implement stacks
// new InternalToolsStack(app, 'InternalTools', { ... });

app.synth();
