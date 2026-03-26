# Venture Deep Dive: SevenNup

## Luxury Hotel Booking Platform

---

## What It Is

**SevenNup** is a luxury hotel booking platform featuring hotel search, reservations, and payment processing. It's built with a modern hybrid architecture — Next.js frontend, Laravel backend — deployed on cost-optimized AWS infrastructure with full CI/CD automation.

---

## Architecture

```
[Next.js 12 Frontend — S3 + CloudFront]
        |
   [REST API]
        |
   [Laravel 8 Backend — EC2]
        |
   [Aurora Serverless v2 — PostgreSQL]
        |
   [Stripe Payments]     [Google Maps API]     [Firebase FCM]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 12, React 18, TypeScript, Tailwind CSS 3, Redux Toolkit |
| **Backend** | Laravel 8 (PHP 7.3/8.0), Passport (OAuth), Spatie Permissions |
| **Database** | Aurora Serverless v2 (PostgreSQL) |
| **Payments** | Stripe |
| **Maps** | Google Maps API |
| **Notifications** | Firebase FCM (push) |
| **Auth** | NextAuth (Google OAuth) |
| **Infrastructure** | AWS CDK (TypeScript) |
| **CI/CD** | GitHub Actions with OIDC, environment-based deploys |
| **Hosting** | EC2 (t4g Spot/On-Demand) + S3/CloudFront |
| **Monorepo** | Nx 20.8, pnpm workspaces |
| **Documentation** | L5-Swagger (auto-generated API docs) |
| **PDF** | DomPDF for booking confirmations |

---

## Key Features

### Modular Backend Architecture
The Laravel backend uses a modular architecture with five distinct packages:
- **User Module** — Registration, authentication, profile management
- **Hotels Module** — Hotel listings, search, availability, room management
- **Masters Module** — Configuration and reference data management
- **Dashboard Module** — Analytics and reporting
- **Administration Module** — System management and user oversight

### Full CI/CD Pipeline
One of the most impressive aspects of this project is the production-grade CI/CD:
- **Pull request checks** — Automated testing on every PR
- **Environment-based deploys** — Push to `develop` deploys to test; push to `main` deploys to production
- **GitHub Actions with OIDC** — Secure, keyless authentication to AWS
- **Automated infrastructure provisioning** via AWS CDK

### Cost-Optimized AWS Architecture
Michael designed the infrastructure with startup economics in mind:
- Spot instances for non-critical environments
- **Aurora Serverless v2** scales to zero during low-traffic periods
- **CloudFront CDN** for frontend delivery at minimal cost

### Hotel Data Management
- CSV-based hotel data seeding for rapid content population
- Image optimization pipeline using Sharp
- Sitemap generation for SEO
- Google Maps integration for location-based search

---

## Technical Highlights

### Hybrid Framework Architecture
This project demonstrates Michael's ability to work across framework ecosystems:
- **Next.js** for the customer-facing frontend (React, SSR, TypeScript)
- **Laravel** for the backend (PHP, Eloquent ORM, modular packages)
- Connected via well-designed REST APIs with Swagger documentation

### Infrastructure-as-Code
The entire infrastructure is defined in AWS CDK (TypeScript):
- VPC networking with proper subnet isolation
- EC2 instances with auto-scaling considerations
- Aurora Serverless v2 with connection pooling
- S3 buckets with CloudFront distributions
- Route53 DNS management
- Security groups and IAM roles

### Monorepo Management
Nx 20.8 manages the multi-package workspace:
- Shared configuration and tooling
- Dependency graph management
- Cached builds for faster CI

---

## What This Demonstrates

- **Cross-framework fluency** — Comfortable with both React/Next.js and Laravel/PHP ecosystems
- **Cost engineering** — Designed infrastructure optimized for startup budgets that scales predictably
- **CI/CD excellence** — Production-grade pipeline with OIDC, environment branching, and automated deploys
- **Infrastructure-as-code** — Complete AWS CDK stack covering compute, database, CDN, and DNS
- **Domain expertise** — Hospitality/booking domain with payments, maps, and notification systems

---

## Key Takeaway

> SevenNup showcases Michael's ability to build a complete booking platform with enterprise-grade infrastructure at startup-friendly costs. The CI/CD pipeline alone would impress most DevOps engineers — and Michael built it alongside the entire application.
