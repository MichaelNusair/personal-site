# Cloud Architecture Expertise — Michael Nusair

## Multi-Cloud, Production-Grade Infrastructure Across AWS, GCP, and Azure

Michael doesn't just deploy to the cloud — he architects cloud-native systems. With production experience across **AWS, GCP, and Azure**, and deep expertise in **serverless, container orchestration, and infrastructure-as-code**, he designs systems that scale efficiently without burning through budget.

---

## AWS — Primary Cloud Platform

Michael's deepest cloud experience is on AWS, where he has designed and deployed production infrastructure for **6+ products**.

### Serverless Architecture
| Service | Production Use |
|---|---|
| **Lambda** | 40+ functions for Teder platform; async workers for GetVL and Tolstoy |
| **API Gateway** | REST and HTTP APIs for serverless backends |
| **SQS** | Async message queuing for AI workloads, job processing |
| **DynamoDB** | NoSQL storage for high-throughput, low-latency access |
| **S3** | Object storage with presigned uploads, static hosting |
| **CloudFront** | CDN for frontend assets and API acceleration |
| **EventBridge** | Event-driven orchestration and scheduled jobs |

### Container & Compute
| Service | Production Use |
|---|---|
| **ECS** | Container orchestration for microservices |
| **EKS** | Managed Kubernetes for enterprise workloads |
| **EC2** | Compute instances (Spot + On-Demand optimization) |
| **Fargate** | Serverless containers for variable workloads |

### Data & AI
| Service | Production Use |
|---|---|
| **RDS (Aurora Serverless v2)** | PostgreSQL with scale-to-zero for cost optimization |
| **Bedrock (Claude 3.5 Sonnet)** | AI-powered document analysis and content generation |
| **Cognito** | User authentication and identity management |
| **Cost Explorer** | Programmatic cost monitoring and optimization |

### Infrastructure-as-Code
| Tool | Production Use |
|---|---|
| **AWS CDK (TypeScript)** | Primary IaC tool for 4+ projects — type-safe infrastructure |
| **CloudFormation** | Stack-based deployments for airspace simulation |
| **Serverless Framework** | Lambda function management for Teder platform |
| **OpenNext** | Next.js deployment on AWS infrastructure |

---

## GCP — Secondary Cloud Platform

### TalkPilot Production Infrastructure
- **Cloud Run** — Auto-scaling containerized backend (0–4 instances)
- **Cloud SQL** — Managed PostgreSQL for tenant data
- **Cloud Storage** — Object storage for media and assets
- **Artifact Registry** — Container image management
- **Secret Manager** — Secure credential storage
- **Cloud Scheduler** — Cron-based job scheduling

### Alert Latency Watch
- **e2-micro** instances for cost-optimized always-on monitoring

---

## Azure

### Enterprise Deployments
- **Container Apps** — Containerized application hosting
- **Azure OpenAI** — Whisper transcription service and Realtime API

---

## Kubernetes Expertise

Michael's Kubernetes experience spans both managed services and on-premises distributions:

- **RedHat OpenShift** — Enterprise Kubernetes for defense systems (3.5 years)
- **AWS EKS** — Managed Kubernetes on AWS
- **Helm** — Package management and templated deployments
- **ArgoCD** — GitOps-style continuous deployment
- **Multi-environment management** — Dev, staging, production clusters

### Kubernetes Capabilities
- Pod and deployment configuration for stateless and stateful workloads
- Service mesh and networking configuration
- Horizontal Pod Autoscaler configuration
- ConfigMap and Secret management
- Persistent Volume management
- Rolling update strategies with zero-downtime deployments
- Resource quota management and cost optimization

---

## Architecture Patterns

### Serverless-First
Michael defaults to serverless when appropriate — Lambda, Cloud Run, Fargate — to minimize operational overhead and align costs with actual usage. He has proven this approach at scale with 40+ Lambda functions running Teder's entire platform.

### Cost-Optimized Design
Every architecture is designed with cost efficiency in mind:
- Aurora Serverless v2 that scales to zero during off-hours
- EC2 Spot instances for non-critical workloads (cost-optimized test environments)
- CloudFront caching to minimize origin requests
- SQS for batching expensive AI operations

### Multi-Regional Resilience
Led disaster recovery planning at DefenseTech, including:
- Multi-regional failover architecture design
- Live failure simulation experiments
- RTO/RPO measurement and optimization
- Recovery runbook documentation

### Security
- VPC networking with proper subnet isolation
- IAM roles with least-privilege access
- OIDC-based keyless authentication for CI/CD
- Enterprise SSO integration (Tyk API Gateway)
- Secret management across all cloud providers

---

## Key Takeaway

> Michael isn't a "deploy to Heroku" engineer. He designs cloud infrastructure from the ground up — VPCs, IAM, CDN, auto-scaling, disaster recovery — across three major cloud providers. Whether you need a lean MVP or a multi-regional enterprise system, he's done both.
