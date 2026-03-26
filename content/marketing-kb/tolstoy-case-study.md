# Case Study: Tolstoy — AI Commerce Platform

## Leading a Zero-to-One Product at the Intersection of AI and E-Commerce

---

## The Company

**Tolstoy** is an AI-powered commerce platform used by a large number of brands to create shoppable video experiences, AI-driven shopping assistants, and intelligent product discovery.

---

## The Challenge

Tolstoy needed a **complete replacement for Shopify's native media gallery** — one that integrated rich analytics, AI-powered features, and an automated experimentation system. The project required:

- Full end-to-end ownership from a single engineer
- Serverless infrastructure that could handle 10x growth spikes
- Seamless integration with the Shopify ecosystem
- Real-time analytics across thousands of merchants
- An A/B testing framework that could orchestrate experiments across multiple product lines

---

## Michael's Role

**Full-Stack Engineer — Project Lead (April 2025–Present)**

Michael led the entire Media Gallery project from zero to production. No existing codebase, no existing architecture — just a product vision and a deadline.

---

## What He Built

### Serverless AWS Infrastructure
- Designed and deployed a complete **AWS CDK** infrastructure stack
- **Lambda functions** for compute, **SQS** for async messaging, **DynamoDB** for fast reads, **RDS** for relational data
- Structured APIs with **Zod schemas** for runtime type safety
- Optimized for cost-effectiveness and lean operations — critical for a startup scaling rapidly

### Shopify-Compatible Widgets
- Built **server-side-rendered Liquid templates** that integrate natively with Shopify themes
- Developed a novel workflow: write **Preact components once**, compile them to both SSR Liquid templates and CSR hydration scripts
- This approach became the open-source framework **Preliquify** — solving a real pain point in the Shopify developer ecosystem

### Analytics Pipelines
- Built data pipelines using **CubeJS** to aggregate and query data from **Snowflake**
- Provided merchants with rich, actionable insights on media gallery performance
- Enabled data-driven decision-making across the Tolstoy platform

### Autonomous A/B Testing System
- Created an automated experimentation framework that spans multiple Tolstoy product lines
- Orchestrates cross-product A/B tests without manual intervention
- Accelerates iteration cycles by continuously optimizing based on real user data

### Agentic UI Components
- Developed cutting-edge **Agentic UI** components that adapt to user behavior in real-time
- Pushed the boundaries of what AI-driven interfaces can do in a commerce context

### Consistent Design System
- Used **ShadCN** for a cohesive merchant control plane
- Ensured consistent UX across all merchant-facing surfaces

---

## Technical Decisions That Mattered

| Decision | Rationale | Outcome |
|---|---|---|
| AWS CDK over CloudFormation | Type-safe infrastructure, faster iteration | Reliable deploys, easy to extend |
| Preact for widgets | Tiny bundle size, Shopify-compatible SSR | Best-in-class performance |
| Zod for API schemas | Runtime validation, auto-generated types | Zero schema drift between frontend and backend |
| CubeJS for analytics | Pre-aggregation, Snowflake-native | Sub-second queries over massive datasets |
| Drizzle ORM | Type-safe, lightweight, modern | Clean database access patterns |

---

## Tools & AI-Assisted Development

Michael leveraged **Cursor IDE** and other AI development tools throughout the project, achieving an estimated **40% acceleration** in development velocity. This wasn't about generating boilerplate — it was about:

- Rapidly exploring the **Shopify Admin API** and prototyping integrations
- Iterating on architecture decisions with AI-assisted code generation
- Accelerating testing and debugging cycles

Michael also **heavily integrated GenAI into the products themselves**, making AI a core part of the user experience rather than just a development tool.

---

## Results

- **Shipped from zero to production** in record time as a single engineer
- Created a product that **replaces Shopify's native media gallery** for Tolstoy merchants
- Built infrastructure that **handles 10x growth spikes** while remaining cost-effective
- Released **Preliquify** as open-source, contributing back to the Shopify developer ecosystem
- Established **autonomous A/B testing** that continues to optimize without manual oversight

---

## Key Takeaway

> Michael didn't just join a team and pick up tickets. He took full ownership of a flagship product — from infrastructure design to frontend polish — and shipped it. That's the kind of engineer who transforms a company's trajectory.
