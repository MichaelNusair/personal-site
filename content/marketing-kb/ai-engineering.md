# AI Engineering Expertise — Michael Nusair

## Building Production AI Systems, Not Just Calling APIs

Michael doesn't just sprinkle AI on top of existing products. He architects AI-native systems where machine intelligence is a core part of the product experience — from real-time voice assistants to intelligent document analysis to autonomous experimentation platforms.

---

## Production AI Systems Built

### 1. Voice AI Shopping Assistant (TalkPilot)
**Technology:** OpenAI Realtime API + WebRTC

The most technically ambitious AI integration in Michael's portfolio. TalkPilot delivers real-time voice conversations between customers and an AI sales associate.

**What makes it hard:**
- Real-time audio streaming via WebRTC — latency matters in voice conversations
- Context management: the AI must know the store's products, policies, current page, and cart
- Multi-turn conversation memory across a shopping session
- Voice activity detection (VAD) and noise reduction in noisy environments
- Production reliability: this is customer-facing, not an internal tool

**Michael's approach:**
- Designed a context engine that feeds product catalog, policies, and browsing history to the AI in real-time
- Built configurable voice settings (voice selection, speech speed, VAD sensitivity)
- Implemented multi-language support with automatic detection
- Deployed on auto-scaling GCP Cloud Run for cost-effective production operation

---

### 2. AI-Powered Lead Generation (GetVL)
**Technology:** AWS Bedrock (Claude 3.5 Sonnet) + Azure OpenAI

GetVL uses AI to convert raw product ideas into structured, professional product plans — complete with architecture recommendations, technology choices, and timeline estimates.

**What makes it hard:**
- Generating structured, useful output from unstructured input (free-form text, PDFs, images)
- Maintaining quality and consistency across diverse input types
- Async processing: AI generation is slow, so the architecture must handle it gracefully
- Cost management: LLM API calls add up quickly without smart batching and caching

**Michael's approach:**
- SQS + Lambda for async AI processing — the user doesn't wait for generation to complete
- Multi-format document ingestion (PDF, DOCX, images) with pre-processing
- Upstash Redis for caching to avoid redundant API calls
- Structured output with Zod validation to ensure AI responses conform to expected schemas

---

### 3. Agentic UI at Tolstoy
**Technology:** AI-powered adaptive components

At Tolstoy, Michael built Agentic UI components — interface elements that adapt their behavior and presentation based on user actions in real-time.

**What makes it hard:**
- Real-time adaptation without perceptible latency
- Balancing AI-driven personalization with consistent UX
- A/B testing AI behaviors at scale across thousands of merchants
- Measuring the impact of adaptive UI on product metrics

**Michael's approach:**
- Built an autonomous A/B testing system that orchestrates cross-product experiments
- Integrated with CubeJS and Snowflake for real-time analytics on AI-driven features
- Designed the system so AI enhancements could be toggled and measured independently

---

### 4. Audio/Video Transcription Service
**Technology:** Azure OpenAI Whisper

Michael built a transcription service on his personal site that processes audio and video files using Azure OpenAI's Whisper model.

**What makes it hard:**
- Large media files need to be chunked for processing
- Audio extraction from video files requires ffmpeg processing
- Async processing pipeline for long-running transcription jobs
- Cost management for large file processing

**Michael's approach:**
- ffmpeg-static for reliable audio/video processing
- Lambda workers for chunked, parallel transcription
- S3 for intermediate file storage during processing
- SQS for job orchestration

---

### 5. Automated Bug Analysis (OthoFeed)
**Technology:** GPT-4

OthoFeed captures pixel-perfect session recordings with rrweb, then uses GPT-4 to analyze them and auto-generate structured bug tickets for Linear and Jira.

**What makes it hard:**
- Converting visual session recordings into structured text descriptions
- Generating actionable bug reports with reproduction steps
- Integrating with project management tools' APIs
- Maintaining quality: AI-generated tickets need to be useful, not noisy

---

### 6. AI Relationship Coaching (Couple-Link)
**Technology:** AI conversation engine

Couple-Link uses AI to guide couples through relationship-building conversations with personalized insights based on conversation history.

**What makes it hard:**
- Sensitive domain requiring careful prompt engineering
- Long-term conversation memory and relationship modeling
- Balancing AI generation with evidence-based therapeutic frameworks

---

## AI Development Tooling

Beyond building AI products, Michael uses AI to accelerate his own development:

### Cursor IDE
Michael leverages Cursor as his primary development environment, achieving an estimated **40% acceleration** in development velocity. He uses it for:
- Architecture exploration and prototyping
- Rapid API integration (e.g., Shopify Admin API exploration)
- Code generation with iterative refinement
- Testing and debugging acceleration

### AI-Assisted Development Philosophy
Michael views AI development tools as **force multipliers, not replacements**. He uses them to:
- Move faster on well-understood patterns
- Explore unfamiliar APIs and frameworks quickly
- Generate boilerplate that he then reviews and refines
- Accelerate testing and documentation

---

## AI Engineering Principles

From building 6+ production AI systems, Michael has developed a set of principles:

1. **AI is a product feature, not a technology choice.** Every AI integration should serve a clear user need.
2. **Async by default.** AI operations are slow and expensive — design architectures that handle this gracefully.
3. **Validate AI output.** Use Zod, structured prompts, and output parsers to ensure AI responses conform to expected schemas.
4. **Measure everything.** A/B test AI features like any other product feature.
5. **Cache aggressively.** LLM calls are expensive — cache results with Redis or similar.
6. **Human in the loop.** Design systems where humans can review, override, or redirect AI behavior.

---

## Key Takeaway

> Michael has built more production AI systems than most engineers will touch in their careers. From real-time voice AI to autonomous experimentation platforms, he understands both the potential and the practical constraints of AI in production. He doesn't just use AI — he engineers it.
