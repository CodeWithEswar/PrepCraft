# Cloudflare Infrastructure & Operational Contract

Cloudflare serves as PrepCraft's **asynchronous event processing, scheduled trigger orchestration, and object storage plane**.
Cloudflare is **NOT a primary application database**; Supabase PostgreSQL remains the single authoritative system of record.

---

## 1. Directory Structure

```text
cloudflare/
├── workers/              # Independently deployable worker service boundaries
├── queues/               # Queue consumer contracts, idempotency, retry/DLQ rules
├── cron/                 # Scheduled triggers, bounded fan-out, timezone logic
├── shared/               # Portable cross-worker utilities & shared contracts
│   ├── contracts/        # Versioned event envelopes & schemas (queue-envelope.ts)
│   ├── validation/       # Runtime payload validation & error classification
│   ├── auth/             # Service authentication & JWT claim extraction
│   └── observability/    # Structured logger with credential/token redaction
├── wrangler/             # Environment configurations (dev, staging, prod)
├── tests/                # Automated Vitest test suite for Cloudflare infrastructure
└── README.md             # This operational guide
```

---

## 2. Core Operational Principles

### 1. Versioned Contracts
All queue messages conform to versioned envelopes created via `createQueueEnvelopeSchema`:
- Version 1 envelope includes: `version`, `type`, `eventId`, `occurredAt`, `workspaceId`, `userId`, `correlationId`, `idempotencyKey`, and `payload`.
- Consumers reject unknown versions and unvalidated payloads before executing side effects.

### 2. At-Least-Once Delivery & Idempotency
Cloudflare Queues delivers messages at least once. Consumers MUST implement atomic idempotency checks:
- Check whether `eventId` / `idempotencyKey` has already been recorded in PostgreSQL.
- Acknowledge without reprocessing if duplicate delivery occurs.

### 3. Error Classification
- **RETRYABLE**: Transient network drops, timeouts, 429/503 responses → Retry with exponential backoff.
- **TERMINAL**: Schema invalidity, malformed JSON, authorization failure → Do not retry; route to Dead-Letter Queue (DLQ).

### 4. Bounded Workloads
- Cron triggers must never loop synchronously through large numbers of candidates.
- Cron triggers query due batches and enqueue work onto Queues for concurrent, bounded worker processing.

### 5. Storage Invariants (R2 & KV)
- **R2**: Stores private object bytes. PostgreSQL stores ownership, permissions, MIME type, size, and metadata.
- **KV**: Optional temporary read cache or public configuration only. Never use KV as authoritative state for attempts, applications, revisions, or user balances.

### 6. Secrets & Environment Isolation
- Secrets are NEVER stored in Git or Wrangler files. Use Cloudflare Secret Store (`wrangler secret put`) and local `.dev.vars`.
- Dev, staging, and production use prefixed resources (`prepcraft-dev-*`, `prepcraft-staging-*`, `prepcraft-prod-*`).

---

## 3. Running Cloudflare Tests

```bash
npm run test
```
The test suite validates runtime payload schemas, error classification, worker authentication, and log sanitization.
