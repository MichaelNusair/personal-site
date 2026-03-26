# Venture Deep Dive: TalkPilot

## AI-Powered Voice Shopping for E-Commerce Stores

---

## What It Is

**TalkPilot** is a voice-powered AI shopping assistant that integrates directly into e-commerce stores. It adds a floating voice widget that helps customers find products, compare items, and get store information through natural conversation — powered by OpenAI's Realtime API.

---

## The Problem

E-commerce stores lose customers who can't find what they're looking for. Text-based chatbots feel impersonal and slow. TalkPilot solves this by giving every store a voice-powered AI sales associate that knows the entire product catalog, store policies, and can engage customers in natural conversation.

---

## Architecture

```
Customer visits store
        |
   [Floating Voice Widget — Vanilla TS]
        |
   [WebRTC Audio Stream]
        |
   [Express.js Backend]
        |
   [OpenAI Realtime API]
        |
   [Context Engine: Products, Policies, Cart]
        |
   [PostgreSQL via Prisma]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express 4, TypeScript |
| **Database** | PostgreSQL 16 (Prisma ORM) |
| **AI** | OpenAI Realtime API |
| **Voice** | WebRTC-based audio streaming |
| **Widget** | Vanilla TypeScript, Vite 6 (single `widget.js` bundle) |
| **Wix Integration** | React 18, Vite 6 (Wix App Market) |
| **WordPress Plugin** | PHP 8.0+, WooCommerce 7.0+ |
| **Storage** | Google Cloud Storage |
| **Email** | SendGrid |
| **Infrastructure** | GCP Cloud Run (auto-scaling 0–4), Cloud SQL, Artifact Registry, Secret Manager |
| **Logging** | Winston |
| **Security** | Helmet, CORS |

---

## Key Features

### Real-Time Voice Conversation
- WebRTC-based voice chat powered by OpenAI's Realtime API
- Natural, human-like voice interaction — not robotic text-to-speech
- Configurable voice selection, speech speed, VAD (voice activity detection), and noise reduction

### Intelligent Product Knowledge
- Integrates with store product catalogs and content pages
- Context-aware: understands what the customer is browsing
- Provides personalized product recommendations based on conversation context

### Multi-Platform Distribution
- **Wix App Market** — Native integration for Wix stores
- **WordPress/WooCommerce Plugin** — PHP plugin with settings dashboard for WP stores
- **Embeddable Widget** — Single JavaScript file that works on any platform

### Multi-Tenant Architecture
- Multi-tenant design with per-store configuration
- PostgreSQL backend via Prisma ORM

### Accessibility & Internationalization
- WCAG 2.1 AA accessibility compliance
- Multi-language support with automatic language detection
- Responsive design that works on mobile and desktop

---

## Technical Highlights

### Single-Bundle Widget Architecture
The customer-facing widget is built in vanilla TypeScript and compiled into a single `widget.js` file via Vite. This means:
- Zero dependencies on the host site
- Minimal performance impact (tiny bundle)
- Works on any e-commerce platform with a single script tag

### Auto-Scaling Infrastructure
Deployed on GCP Cloud Run with auto-scaling from 0 to 4 instances. The serverless model means:
- No idle costs when stores aren't receiving visitors
- Automatic scale-up during traffic spikes
- Cost-effective for a bootstrapped product

### Knowledge Ingestion
TalkPilot integrates with store content and product data to keep the AI assistant informed and accurate.

---

## What This Demonstrates

- **Cutting-edge AI integration** — OpenAI Realtime API for production voice AI (not a demo or prototype)
- **Multi-platform distribution** — Same core product deployed as Wix app, WordPress plugin, and embeddable widget
- **Product-market fit thinking** — Solved a real e-commerce problem with a low-friction integration model
- **Infrastructure optimization** — GCP Cloud Run for cost-effective auto-scaling
- **Full-stack ownership** — Backend, frontend widget, Wix app, WordPress plugin, cloud infrastructure — all built by one person

---

## Key Takeaway

> TalkPilot represents the bleeding edge of AI-powered commerce. Michael didn't just build a chatbot — he built a multi-platform voice AI product with real-time audio streaming, intelligent product knowledge, and enterprise-grade multi-tenancy. It ships as a single script tag.
