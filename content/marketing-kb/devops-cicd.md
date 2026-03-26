# DevOps & CI/CD Expertise — Michael Nusair

## Pipelines From Day One — Every Project, Every Time

Michael doesn't treat DevOps as someone else's problem. He sets up CI/CD pipelines, containerization, and deployment automation from the very first commit. Across 9+ projects, he's built production-grade DevOps infrastructure that most organizations struggle to establish with dedicated platform teams.

---

## CI/CD Pipelines

### GitHub Actions (Primary)
Michael's go-to CI/CD platform for all recent projects. Production examples include:

**SevenNup (Hotel Booking Platform)**
- Pull request checks with automated testing
- Environment-based deployment: `develop` branch to test, `main` branch to production
- **OIDC authentication** — keyless, secure access to AWS (no stored credentials)
- Infrastructure provisioning via AWS CDK as part of the pipeline
- Artifact caching for faster builds

**PrintUp (SaaS Platform)**
- Monorepo-aware pipelines using Nx
- Parallel test execution (Jest, Vitest, Playwright)
- Docker image builds and registry pushes
- E2E test execution in CI

**General Patterns**
- Branch protection rules with required status checks
- Automated dependency updates
- Code quality gates (linting, type checking)
- Build caching and artifact management

### Jenkins (Defense Systems)
- Enterprise CI/CD for Kubernetes-deployed microservices
- Pipeline-as-code with Jenkinsfile
- Integration with Helm for deployment packaging
- Multi-environment promotion workflows (dev, staging, production)

### ArgoCD (GitOps)
- GitOps-style continuous deployment for Kubernetes workloads
- Declarative application definitions
- Automated sync with drift detection
- Rollback capabilities based on Git history

---

## Containerization

### Docker
Michael containerizes every project. His Docker expertise includes:

- **Multi-stage builds** for optimized production images
- **Development containers** with Docker Compose for local environments
- **11 Dockerfiles** in the airspace simulation project alone — one per microservice
- Build argument management for environment-specific configuration
- Layer caching optimization for faster builds
- Security-hardened base images

### Docker Compose
- Local development environments that mirror production
- Service dependency management with health checks
- Volume management for persistent development data
- Network isolation between services

### Container Registries
- **AWS ECR** — Image storage for AWS-deployed services
- **GCP Artifact Registry** — Container management for Cloud Run deployments
- Automated image tagging and lifecycle policies

---

## Infrastructure-as-Code

### AWS CDK (TypeScript) — Primary IaC Tool
Michael's preferred infrastructure tool, used across 4+ projects:

- **Type-safe infrastructure** — Caught misconfiguration at compile time
- **Reusable constructs** — Shared patterns across projects
- **Complete stack definitions** — VPC, compute, database, CDN, DNS in code
- **Environment management** — Dev, staging, production from the same codebase

**Stacks built:**
- Lambda + SQS + DynamoDB serverless architectures (GetVL, Tolstoy)
- EC2 + Aurora Serverless + CloudFront traditional web apps (SevenNup)
- VPC networking with subnet isolation and security groups
- Route53 DNS management and SSL certificate provisioning

### CloudFormation
- Template-based infrastructure for the airspace simulation
- EC2 + VPC + Elastic IP provisioning
- One-command deploy/teardown scripts

### Serverless Framework
- Lambda function management for Teder platform (40+ functions)
- API Gateway configuration
- Custom domain management
- Stage-based deployment (dev, prod)

---

## Kubernetes Operations

### RedHat OpenShift (3.5 Years — Defense)
- Enterprise Kubernetes platform management
- Deployment and service configuration for 30+ microservices
- Helm chart development and management
- Rolling updates with zero-downtime deployment strategies
- Resource quota management and cost optimization
- ConfigMap and Secret management for environment configuration
- Persistent Volume claims for stateful workloads

### Kubernetes Patterns
- Horizontal Pod Autoscaler configuration
- Liveness and readiness probe design
- Pod disruption budgets for maintenance windows
- Network policies for inter-service communication control
- Service mesh concepts and implementation

---

## Monitoring & Observability

### Structured Logging
- **Pino** — High-performance structured logging (PrintUp, Node.js services)
- **Winston** — Configurable logging (TalkPilot)
- **spdlog** — C++ structured logging (airspace simulation)
- Correlation ID propagation across distributed services

### Analytics & Metrics
- **CubeJS + Snowflake** — Product analytics at Tolstoy
- **PostHog** — User analytics and feature flags (GetVL)
- **Facebook Pixel + HubSpot** — Marketing analytics (Teder)

---

## Security Practices

### Authentication & Authorization
- **OIDC** for CI/CD — No stored credentials in pipelines
- **Enterprise SSO** — Tyk API Gateway with SAML/OAuth2
- **AWS Cognito** — User pool management with token lifecycle
- **NextAuth** — OAuth integration for web applications
- **JWT** — Token-based auth with jose library

### Infrastructure Security
- VPC with private subnets for databases and internal services
- Security groups with least-privilege network rules
- IAM roles with minimal permissions (no wildcard policies)
- Secret management via AWS Secrets Manager, GCP Secret Manager
- Helmet.js and CORS configuration for web services

---

## Deployment Strategies

| Strategy | Where Used |
|---|---|
| **Blue-Green** | Defense system deployments |
| **Rolling Update** | Kubernetes microservice updates |
| **Canary** | A/B testing at Tolstoy |
| **Serverless** | Lambda auto-deployment (Teder, GetVL) |
| **GitOps** | ArgoCD-managed Kubernetes deployments |

---

## Key Takeaway

> Michael is the rare engineer who treats DevOps as a first-class concern, not an afterthought. He's built CI/CD pipelines with GitHub Actions and Jenkins, managed Kubernetes clusters with Helm and ArgoCD, containerized dozens of services, and defined infrastructure-as-code across AWS, GCP, and Azure. When you hire Michael, you don't need a separate DevOps engineer.
