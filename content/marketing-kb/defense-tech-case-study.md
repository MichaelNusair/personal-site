# Case Study: DefenseTech — Mission-Critical Command & Control

## 3.5 Years Building Systems Where Failure Is Not an Option

---

## The Context

Michael spent **3.5 years as a Full-Stack Engineer** (and an additional year as Product Manager) at a defense technology organization in Israel, working on a **mission-critical command and control (C2) system** responsible for defense operations and safety management.

This wasn't a typical SaaS environment. The system operated **24/7** under extreme reliability requirements. Downtime didn't mean lost revenue — it meant compromised operational capability.

---

## The Technical Challenge

When Michael joined the engineering team, the system was a **monolithic application** struggling to scale. The organization needed:

- A migration path from monolith to microservices — without disrupting active operations
- Enterprise-grade authentication and authorization
- Distributed data management with real-time capabilities
- Kubernetes-based orchestration for flexible deployment
- A disaster recovery plan that could survive regional failures
- Continued maintenance of the legacy geospatial frontend

---

## What Michael Built

### Monolith-to-Microservices Migration
The centerpiece of Michael's tenure was leading the transformation of the system from a monolithic architecture to **30+ microservices**. This involved:

- Decomposing tightly coupled modules into independent services
- Designing service boundaries around operational domains
- Implementing inter-service communication patterns
- Ensuring zero-downtime migration with careful rollout strategies
- Maintaining backward compatibility throughout the multi-year transition

### API Gateway & Enterprise SSO
Michael led the adoption of **Tyk API Gateway**, integrating it with enterprise SSO solutions to meet strict authentication and authorization requirements. This work required deep expertise in:

- API gateway architecture and configuration
- Identity management protocols (OAuth2, SAML, OpenID Connect)
- Security token validation and propagation across microservices
- Role-based access control at the gateway and service level

### GraphQL API Layer
Michael established **GraphQL as the standard API framework** across backend services, providing:

- Flexible query capabilities for complex operational data
- Schema-driven development with strong typing
- Efficient data fetching for the frontend's diverse visualization needs

### Distributed Data Infrastructure
- **MongoDB** with Mongoose ODM for operational data storage
- **Redis** for multiple distributed patterns: queuing, caching, pub/sub messaging, and distributed locking
- Designed data consistency strategies appropriate for each microservice's requirements

### Kubernetes & DevOps
- Managed **Kubernetes (OpenShift)** deployments across multiple environments
- Built CI/CD pipelines with **Jenkins**, **Helm** charts, and **ArgoCD** for GitOps-style deployments
- Maintained infrastructure reliability across development, staging, and production clusters

### Disaster Recovery Planning
Michael led the system's **Disaster Recovery Plan (DRP)** — not just on paper, but through live experiments:

- Designed multi-regional failover architectures
- Conducted controlled failure simulations to validate recovery procedures
- Measured and improved Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)
- Documented and trained the team on recovery runbooks

### Legacy System Modernization
Maintained the existing **AngularJS-Cesium geospatial visualization system** while progressively integrating modern **React** and **Material UI** components. This required:

- Understanding and maintaining a large legacy codebase
- Designing migration patterns that didn't disrupt operational users
- Bridging two frontend frameworks in a single application

---

## The On-Call Experience

Michael served as the **senior on-call engineer** in a 24/7 rotation during high-stakes operational periods. This meant:

- Being the first responder for production incidents
- Diagnosing complex distributed system failures under time pressure
- Coordinating with operations teams who depended on system availability
- Conducting post-incident reviews and feeding improvements back into the system

---

## Technologies Used

| Category | Stack |
|---|---|
| **Frontend** | AngularJS, Cesium (3D geospatial), React, Material UI |
| **Backend** | Node.js, Express, GraphQL |
| **Database** | MongoDB, Mongoose, Redis |
| **Infrastructure** | Kubernetes (OpenShift), Docker |
| **CI/CD** | Jenkins, Helm, ArgoCD |
| **API Management** | Tyk API Gateway, Enterprise SSO |
| **Messaging** | Redis Pub/Sub, Bull queues |

---

## Impact

- Successfully migrated a **monolithic system to 30+ microservices** without operational disruption
- Established **API gateway patterns** that became the standard for the organization
- Built **disaster recovery capabilities** that demonstrably improved system resilience
- Maintained **24/7 system availability** during critical operational periods
- Created a modernization path for the legacy frontend without forcing a full rewrite

---

## Key Takeaway

> Defense engineering isn't on most developers' resumes. Michael spent 3.5 years in an environment where systems must be resilient, secure, and available at all times. The engineering discipline, operational awareness, and architectural rigor he developed there inform everything he builds today.
