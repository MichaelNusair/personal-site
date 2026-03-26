# Venture Deep Dive: GetVL

## AI-Powered Technical Planning Platform

---

## What It Is

**GetVL** is an AI-powered platform that transforms product ideas and technical requirements into structured, professional product plans. Users submit descriptions or upload documents, and the system generates comprehensive technical plans using LLMs.

---

## The Problem

Technical founders and business owners often have product ideas but lack the structured thinking to turn them into actionable plans. GetVL bridges this gap by using AI to generate comprehensive technical blueprints from unstructured input.

---

## Architecture

```
User submits input (text, PDF, DOCX, images)
        |
   [Next.js App Router Frontend]
        |
   [API Routes + Zod Validation]
        |
   [AWS SQS Queue]
        |
   [Lambda Worker]
        |
   [AWS Bedrock — Claude 3.5 Sonnet]
        |
   [Structured Plan Generation]
        |
   [PostgreSQL via Prisma ORM]
        |
   [Shareable Output URL]
        |
   [Admin Dashboard]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, Tailwind CSS 4, ShadCN/Radix, Recharts |
| **Backend** | Next.js API Routes, Prisma ORM 5.22 |
| **AI Engine** | AWS Bedrock (Claude 3.5 Sonnet), Azure OpenAI |
| **Database** | PostgreSQL (AWS RDS) |
| **Queue** | AWS SQS |
| **Storage** | AWS S3 |
| **Cache** | Upstash Redis |
| **Auth** | Magic link (jose JWT), Mailjet email |
| **Worker** | AWS Lambda for async plan generation |
| **Infrastructure** | AWS CDK, OpenNext 3 |
| **Monorepo** | Nx 22.4, pnpm workspaces |
| **Analytics** | PostHog |
| **Integrations** | Linear SDK, web-push notifications |
| **Internationalization** | next-intl |
| **Cost Monitoring** | AWS Cost Explorer SDK |

---

## Key Features

### AI Plan Generation
- Users submit product ideas or upload documents (PDF, DOCX, images)
- AWS Bedrock with Claude 3.5 Sonnet analyzes inputs and generates comprehensive product plans
- Plans include architecture recommendations, technology choices, timeline estimates, and risk assessments

### Document Intelligence
- Upload support for PDFs, Word documents, and images
- AI analysis extracts key requirements and context from uploaded materials
- Structured output regardless of input format

### PDF Export
- Generate professional PDF documents from AI-generated plans
- PDF rendering with React PDF renderer

### Admin Dashboard
- Management interface with filtering and search
- Analytics visualizations with Recharts
- Cost tracking via AWS Cost Explorer integration
- Linear integration for task management

### Multi-Package Architecture
- `database` — Prisma schema and migrations
- `llm` — AWS Bedrock integration layer
- `validation` — Shared Zod schemas
- `ui` — Reusable component library

---

## What This Demonstrates

- **AI product design** — Not just calling an API; Michael designed a complete AI-powered product with structured output and multi-format input
- **Serverless architecture** — Async processing with SQS + Lambda for cost-effective, scalable AI workloads
- **Modern full-stack** — Next.js 16 App Router, React 19, Prisma, all the latest patterns
- **Infrastructure-as-code** — Full AWS CDK deployment with OpenNext for Next.js hosting

---

## Key Takeaway

> GetVL shows Michael designing a complete AI-powered product — from multi-format document ingestion to LLM-driven plan generation to async serverless processing — all built solo from infrastructure to UI.
