# Venture Deep Dive: Teder

## Live Event Ticketing and Streaming Platform

---

## What It Is

**Teder** is a full-featured live event ticketing and streaming platform. Artists and booking agents manage events, customers purchase tickets, and audiences watch live-streamed performances via Vimeo integration. It's a complete marketplace for live entertainment.

---

## The Problem

Live event platforms are typically fragmented — one tool for ticketing, another for streaming, another for artist management. Teder unifies the entire lifecycle: artist onboarding, event creation, ticket sales, live streaming, and post-event management.

---

## Architecture

```
[React Frontend — MUI + Ant Design]
        |
   [API Gateway]
        |
   [FastAPI on AWS Lambda — 40+ functions]
        |
   [AWS Cognito — Auth]     [Stripe — Payments]     [Vimeo — Streaming]
        |
   [MySQL on AWS RDS]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 17, Material UI 5, Ant Design, Redux (persist + logger), Styled Components |
| **Backend** | Python 3.9, FastAPI, Mangum (Lambda adapter), Boto3 |
| **Auth** | AWS Cognito (user pools, token refresh, password reset) |
| **Database** | MySQL (AWS RDS via VPC) |
| **Payments** | Stripe (ticket purchases, refunds) |
| **Streaming** | Vimeo API (placeholder generation, stream start/end management) |
| **Infrastructure** | Serverless Framework (AWS Lambda + API Gateway) |
| **Notifications** | Firebase FCM (push notifications) |
| **Analytics** | Facebook Pixel, HubSpot tracking |
| **Charts** | DevExpress Charts |
| **Video** | Vimeo Player SDK, video.js |

---

## Scale

This isn't a toy project. The platform includes:

- **40+ Lambda functions** covering the full platform lifecycle
- **Multi-role user system** — customers, artists, booking agents, admins
- **Stripe payment processing**
- **Live video streaming** with Vimeo API integration

---

## Key Features

### For Artists
- Self-service signup and profile management
- Genre tagging and discoverability
- Performance scheduling and management

### For Booking Agents
- Artist roster management
- Statistics and analytics dashboards

### For Customers
- Event discovery and ticket purchasing
- Secure payment processing via Stripe
- Live stream viewing with Vimeo Player integration
- Push notifications for upcoming events (Firebase FCM)

### For Administrators
- Complete show management — create, edit, archive events
- User management across all roles
- Video status monitoring and stream management
- Ticket and customer management dashboards

### Scheduled Operations
- **Scheduled Lambda functions** for background processing and automation

---

## Technical Highlights

### Serverless at Scale
40+ Lambda functions orchestrated via Serverless Framework, proving that complex platforms can be built entirely on serverless infrastructure:
- Per-function scaling based on demand
- Pay-per-invocation cost model
- No server management overhead

### Stripe Payment Integration
Stripe integration handles ticket purchases and refund processing.

### Cognito-Based Auth
Full authentication lifecycle using AWS Cognito:
- User registration with email verification
- Login with token management
- Password reset flows
- Token refresh for session persistence

---

## What This Demonstrates

- **Complex domain modeling** — Multi-stakeholder marketplace with distinct user roles and workflows
- **Serverless architecture mastery** — 40+ functions operating as a cohesive platform
- **Stripe integration** — Payment processing within a marketplace context
- **Third-party integration** — Vimeo API, Firebase, Facebook Pixel, HubSpot
- **Python backend** — Demonstrating language versatility beyond the TypeScript ecosystem
- **Full product ownership** — Every aspect from auth to payments to streaming, built by one person

---

## Key Takeaway

> Teder proves Michael can build complex, multi-stakeholder marketplace platforms. 40+ Lambda functions, payment processing, live streaming, and scheduled operations — all designed and implemented as a solo builder.
