# Cloudflare boundary

## Purpose

Cloudflare is the asynchronous/edge/storage plane, not an alternative system of record or a set of mandatory microservices. Phase 03 contains only portable, versioned queue contracts and their tests. No worker, queue, cron schedule, bucket, KV namespace or Wrangler deployment configuration exists yet.

| Future boundary | Justification / ownership |
| --- | --- |
| `workers/api-gateway` | Only if an actual external/edge API requirement appears; not a duplicate Next API |
| `workers/reminder-dispatcher` | Scheduled due-work selection and enqueueing |
| `workers/analytics-processor` | Derived aggregates from durable events |
| `workers/import-worker` | Bounded, validated long-running imports |
| `workers/file-service` | R2 object access after authorization; metadata stays in PostgreSQL |
| `queues/analytics-events`, `notifications`, `imports` | Delivery settings, retry/DLQ policies and workload-specific schemas |
| `cron/daily-planner`, `revision-reminders`, `weekly-review` | Scheduling and operational ownership, created only with real handlers |

## Contracts and delivery

`shared/contracts/queue-envelope.ts` validates a version-1 envelope with a literal event name, UUID event/workspace/correlation IDs, optional user ID, timestamp and bounded idempotency key. Each consumer supplies its strict payload schema. Reject unknown versions and invalid payloads before processing; producers validate too. Do not place credentials, raw user files or unnecessary PII in messages.

Cloudflare Queues delivers [at least once](https://developers.cloudflare.com/queues/reference/delivery-guarantees/). Consumers need a durable, atomic idempotency claim keyed by consumer/event or operation key; an in-memory Set or KV eventual read is insufficient. Commit side effects before acknowledgement. Retriable infrastructure errors get bounded retries; invalid/poison messages go to an observable dead-letter path. Outbox dispatch may duplicate delivery, so consumer idempotency is required even with producer deduplication.

## Storage and security

PostgreSQL owns file owner, workspace, object key, size/type and lifecycle status. R2 holds private bytes. Server-side authorization precedes short-lived upload/download authorization; user-provided object keys are never trusted as proof of ownership. Validate file sizes/types, quarantine as needed, and bound retention. KV is only for replaceable cache/config with explicit invalidation/TTL, never membership, balances or authoritative state.

## Runtime and failure modes

Workers import portable contracts, never Next.js modules or server environment files. Add Wrangler, bindings types, per-worker environment validation and worker-runtime tests with the first actual worker; test locally before configuring real queues/crons. Keep credentials in Wrangler secrets and ignored `.dev.vars`. No fake account IDs or production bindings are checked in. See [worker runbook](../runbooks/worker-failure.md) and [ADR 0002](../adr/0002-cloudflare-async-plane.md).
