# Cloudflare Architecture & Asynchronous Plane Contract

## 1. Purpose & Boundary

Cloudflare serves as PrepCraft's **asynchronous event processing, scheduled trigger orchestration, and object storage plane**.
Cloudflare is **NOT a second system of record**; Supabase PostgreSQL remains the single authoritative database.

---

## 2. Infrastructure Ownership

All edge and asynchronous infrastructure belongs under `cloudflare/`:

```text
cloudflare/
├── workers/              # Independently deployable Worker service boundaries
├── queues/               # Queue consumer contracts, delivery guarantees, retry & DLQ rules
├── cron/                 # Scheduled triggers, bounded fan-out orchestration, timezone logic
├── shared/               # Portable cross-worker utilities & shared contracts
│   ├── contracts/        # Versioned event envelopes (queue-envelope.ts)
│   ├── validation/       # Runtime payload validation & error classification (payload-validator.ts)
│   ├── auth/             # Service authentication & JWT claim extraction (worker-auth.ts)
│   └── observability/    # Structured logger with credential/token redaction (structured-logger.ts)
├── wrangler/             # Non-secret environment configurations (dev, staging, prod)
├── tests/                # Automated Vitest test suite for Cloudflare infrastructure
└── README.md             # Operational manual
```

---

## 3. Workers Contract

Each Worker has a single responsibility and defines typed bindings explicitly in `src/bindings.ts`:
- `reminder-dispatcher`: Evaluates due revision intervals and daily plans; enqueues tasks to `notifications`.
- `analytics-processor`: Consumes domain events; computes workspace mastery trends and activity metrics.
- `import-worker`: Processes large CSV/catalog imports in bounded batches.
- `file-service`: R2 object streaming and presigned URL coordination after Supabase authorization check.

Workers must remain runtime portable and must never import Next.js modules or application route code.

---

## 4. Queue Architecture & Delivery Guarantees

```text
PRODUCER
   ↓
Validate versioned envelope (QueueEnvelope<T>, Version 1)
   ↓
Cloudflare Queue
   ↓
CONSUMER
   ↓
Validate payload schema (Zod)
   ↓
Atomic idempotency check
   ├── Already completed → Safe acknowledgment (no-op)
   └── Not completed
            ↓
       Execute bounded operation
            ↓
       Record completion state in PostgreSQL
            ↓
       Acknowledge message
```

### Idempotency
Cloudflare Queues delivers messages **at least once**. Consumers must be idempotent using deterministic `eventId` or `idempotencyKey` claims.

### Retry Classification
- **RETRYABLE**: Transient network timeouts, connection resets, 429/503 responses → Retry with backoff.
- **TERMINAL**: Schema invalidity, malformed JSON, authorization permanent failure → Do not retry; route to Dead-Letter Queue (DLQ).

---

## 5. Cron Triggers & Bounded Workloads

Cron triggers (`daily-planner`, `revision-reminders`, `weekly-review`) must NOT process all users synchronously.
- **Fan-Out via Queues**: Cron queries a bounded batch of due entities and enqueues messages onto Queues. Queue workers process the batches concurrently.
- **Occurrence Idempotency**: Scheduled tasks use occurrence keys (e.g. `reminder:revision:{userId}:{timestampWindow}`) to prevent duplicate notifications during retries.
- **Timezone Awareness**: Candidate workspaces store their IANA timezone; human-facing morning reminders are evaluated against local time, not raw UTC.

---

## 6. Storage Invariants (R2 & KV)

- **R2 Storage**: Stores raw object bytes. PostgreSQL stores file metadata, ownership, MIME type, size, and permissions. User-supplied object keys are never used as proof of authorization.
- **KV Storage**: Strictly for optional, replaceable read-through cache or public configuration with explicit TTLs. Never store authoritative attempts, revisions, applications, or user balances in KV.

---

## 7. Security & Observability

- All worker logs use `WorkerLogger` to emit structured JSON with context fields (`worker`, `requestId`, `eventId`, `queue`, `operation`, `workspaceId`, `durationMs`, `outcome`).
- Credentials, bearer tokens, passwords, authorization headers, and private code submissions are strictly redacted by `sanitizeLogData`.
- Secrets are stored exclusively in Cloudflare Secret Store (`wrangler secret put`) and `.dev.vars`, never in Git.
- See [Cloudflare Operational Manual](../../cloudflare/README.md) and [ADR 0002](../adr/0002-cloudflare-async-plane.md), [ADR 0004](../adr/0004-idempotent-versioned-queue-consumers.md).
