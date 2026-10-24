# Cloudflare Queues — Architecture & Delivery Contract

PrepCraft utilizes Cloudflare Queues for asynchronous event decoupling, out-of-band analytics derivation, background imports, and notification dispatching.

---

## 1. Queue Architecture

```text
PRODUCER (Next.js Server Action / Cron Trigger)
       ↓
Validate versioned envelope (cloudflare/shared/contracts/queue-envelope.ts)
       ↓
Cloudflare Queue
       ↓
CONSUMER (Cloudflare Worker Queue Handler)
       ↓
Validate envelope & payload schema (cloudflare/shared/validation/payload-validator.ts)
       ↓
Idempotency claim (database check on eventId / idempotencyKey)
   ├── Already completed → Acknowledge message safely (no-op)
   └── Not completed
            ↓
       Perform bounded domain operation
            ↓
       Record completion state
            ↓
       Acknowledge message
```

---

## 2. Planned Queues

| Queue Name | Producer | Consumer | Dead-Letter Queue (DLQ) |
| --- | --- | --- | --- |
| `analytics-events` | Next.js Server Mutations | `analytics-processor` | `analytics-events-dlq` |
| `notifications` | Cron `reminder-dispatcher` | `notification-consumer` | `notifications-dlq` |
| `imports` | Next.js Import Actions | `import-worker` | `imports-dlq` |

---

## 3. Delivery Guarantees & Idempotency

Cloudflare Queues guarantees **at-least-once delivery**. A message may be redelivered if:
- A network partition occurs before consumer acknowledgment.
- Consumer execution times out or encounters a retryable transient failure.

**Consumers MUST be idempotent**:
1. Every message carries a unique `eventId` (UUID) and an `idempotencyKey`.
2. Before executing side effects, the consumer checks whether the `idempotencyKey` has already been recorded as completed.
3. If previously processed, the consumer acknowledges the message immediately without re-executing side effects.
4. Completed operations atomically write their idempotency record alongside state updates.

---

## 4. Retry Classification

Consumers must explicitly differentiate error types:

### RETRYABLE Errors
- Transient network failures (`ECONNRESET`, `ETIMEDOUT`).
- Downstream database connection limits or rate limits (HTTP 429, 502, 503, 504).
- Temporary external API outages.
- **Action**: Call `message.retry()` with backoff.

### TERMINAL Errors
- Schema validation failures (unrecognized contract version, missing required fields).
- Malformed JSON payloads.
- Authentication/authorization permanent rejections.
- Non-existent entity references that will never become valid.
- **Action**: Do NOT retry indefinitely. Acknowledge message or forward to the Dead-Letter Queue (DLQ) with structured error context.

---

## 5. Dead-Letter Queue (DLQ) Strategy

Critical queues must configure a DLQ to capture messages that have exhausted their retry limit (e.g. `max_retries = 5`).
- The DLQ retains message payload, envelope metadata, and failure reasons.
- Sanitized logging records the terminal error category and correlation ID.
- Operational runbooks define manual or automated replay once root cause is resolved.
