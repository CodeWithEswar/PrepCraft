# PrepCraft Engineering Documentation

The authoritative living specification for PrepCraft. Start with [System Overview](architecture/system-overview.md), [Product Principles](product/product-principles.md), and [Local Development](runbooks/local-development.md).

## Product & Roadmap
- [Product Overview](product/product-overview.md) — Mission, core loop, and scope boundaries.
- [Product Principles](product/product-principles.md) — Guiding philosophy (evidence over scores, no AI mocks).
- [Terminology](product/terminology.md) — Ubiquitous language across code and design.
- [Roadmap](product/roadmap.md) — Planned implementation sequence (Phases 01–13).

## Architecture
- [System Overview](architecture/system-overview.md) — Four primary architectural layers.
- [Frontend Architecture](architecture/frontend.md) — App Router, Server Components, shadcn/ui, Hugeicons.
- [Backend Architecture](architecture/backend.md) — Domain services, Server Actions, query/mutation layers.
- [Database Architecture](architecture/database.md) — Supabase PostgreSQL, schema, migrations, RLS.
- [Cloudflare Async Plane](architecture/cloudflare.md) — Workers, Queues, Cron, and R2 storage.
- [Authentication](architecture/authentication.md) — Supabase SSR, session cookies, and OAuth flow.
- [Authorization](architecture/authorization.md) — Workspace isolation and defense-in-depth access control.
- [Events & Asynchronous Workflows](architecture/events.md) — Queue contracts and domain event payloads.
- [Observability](architecture/observability.md) — Structured logging, correlation IDs, error reporting.

## Feature Boundaries
- [Domain Ownership Map](features/domain-map.md) — Responsibilities and delivery order across all modules.
- [Authentication](features/auth.md) — Identity, OAuth, session lifecycle.
- [Onboarding](features/onboarding.md) — Candidate profile setup and target goal initialization.
- [Workspaces](features/workspaces.md) — Tenant isolation and membership resolution.
- [Planning & Today](features/planning.md) — Dynamic planning engine and Today command center.
- [Practice Studio](features/practice.md) — Canonical question catalog and deliberate practice.
- [Attempts & Mistakes](features/attempts.md) — Solution logging, reflections, mistake categorization.
- [Revision](features/revision.md) — Spaced repetition scheduler and review intervals.
- [Mastery & Readiness](features/mastery.md) — Objective preparation evidence evaluation.
- [Real Interview Tracking](features/interviews.md) — Real OA/interview rounds, Interview Day Mode, journal.
- [Application Pipeline](features/applications.md) — 9-stage recruitment tracking and resumes.

## Security & Reliability
- [Threat Model](security/threat-model.md) — Security boundaries and untrusted inputs.
- [Row Level Security (RLS)](security/rls.md) — Database enforcement and tenant policies.
- [Secrets Management](security/secrets.md) — Environment variable tiers and leak prevention.
- [Object Storage](security/storage.md) — Private R2 buckets and presigned URL access.
- [Incident Response](security/incident-response.md) — Severity triage, containment, and post-mortems.

## Operations & Runbooks
- [Local Development](runbooks/local-development.md) — Environment setup, ports, Supabase CLI.
- [Deployment](runbooks/deployment.md) — Production deployment to hosting and edge.
- [Migrations](runbooks/migrations.md) — Migration creation, testing, and deployment.
- [Rollback Procedures](runbooks/rollback.md) — Reverting deployments, migrations, and workers safely.
- [Worker Failure Recovery](runbooks/worker-failure.md) — Diagnosing queue and edge worker incidents.

## Architecture Decision Records (ADRs)
- [ADR Index](adr/README.md)
  - [ADR 0001: Supabase as System of Record](adr/0001-supabase-system-of-record.md)
  - [ADR 0002: Cloudflare for Asynchronous & Edge Plane](adr/0002-cloudflare-async-plane.md)
  - [ADR 0003: Feature-Oriented Frontend Architecture](adr/0003-feature-oriented-frontend.md)
