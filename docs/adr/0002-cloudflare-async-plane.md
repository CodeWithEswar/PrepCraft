# 0002: Cloudflare is the async/edge/storage plane

**Status:** Accepted, 24 October 2026.

**Context:** Reminders, imports, derived analytics and private files may need runtimes beyond an interactive request.

**Decision:** Introduce Workers/Queues/Cron/R2 only for concrete workloads. Keep portable validated contracts under `cloudflare/shared/contracts`. Use selective KV for disposable cache/config. The main product remains one modular application.

**Alternatives:** Every domain as a microservice, running all work in Next requests, or using Cloudflare as a competing relational database.

**Consequences:** Messages are versioned and consumers idempotent. Durable outbox state stays in PostgreSQL. Phase 03 does not create fake worker entry points, deployment bindings or queues. Selecting a Next hosting adapter is a separate decision.
