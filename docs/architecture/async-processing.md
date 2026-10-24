# PrepCraft — Asynchronous Processing Architecture
## Cloudflare Queues, Workers, Cron Triggers & Idempotency

This document specifies the asynchronous processing architecture of PrepCraft.
Asynchronous processing decouples user-facing transactional mutations from background side-effects, scheduled reminders, analytics calculations, and long-running batch operations.

---

## 1. Core Architectural Principle

Asynchronous work follows a strict, unidirectional processing pipeline:

```text
PRODUCER (Server Mutation / Cron Trigger)
       ↓
Versioned Envelope Validation (cloudflare/shared/contracts/queue-envelope.ts)
       ↓
Cloudflare Queue (prepcraft-{env}-<queue-name>)
       ↓
CONSUMER (Cloudflare Worker Queue Handler)
       ↓
Runtime Schema Validation (cloudflare/shared/validation/payload-validator.ts)
       ↓
Atomic Idempotency Claim (PostgreSQL check on eventId / idempotencyKey)
   ├── Already Processed → Safe acknowledgment (no-op)
   └── Not Processed
            ↓
       Execute Bounded Domain Operation (Domain Service)
            ↓
       Record Completion State in PostgreSQL
            ↓
       Acknowledge Message
```

### Critical Invariants
1. **Supabase PostgreSQL is the System of Record**: Queues and Workers process background tasks or produce derived views. They do not maintain an alternate authoritative state store.
2. **At-Least-Once Delivery**: Distributed message delivery guarantees at-least-once delivery. Consumers **must be idempotent**.
3. **Non-Blocking User Mutations**: Synchronous user requests must never hold database connections or HTTP responses open waiting for background queue delivery or external webhooks.

---

## 2. Queue Inventory & Topologies

| Queue Name | Primary Producer | Target Consumer | Dead-Letter Queue (DLQ) | Max Retries | Batch Size |
|---|---|---|---|---|---|
| `analytics-events` | Server Action / Attempt Mutation | `analytics-processor` | `analytics-events-dlq` | 5 | 50 |
| `notifications` | Cron `reminder-dispatcher` | `notification-consumer` | `notifications-dlq` | 5 | 20 |
| `imports` | Catalog / Question Import Action | `import-worker` | `imports-dlq` | 3 | 10 |

---

## 3. Versioned Envelope Contract

All messages enqueued to Cloudflare Queues conform strictly to `QueueEnvelope<T>` (`CURRENT_ENVELOPE_VERSION = 1`):

```typescript
export interface QueueEnvelope<TPayload> {
  version: 1
  eventId: string          // UUIDv4 unique to this event instance
  type: string             // Canonical event name (e.g., "question.attempt.completed")
  occurredAt: string       // ISO 8601 UTC timestamp with timezone offset
  workspaceId: string      // Tenant identifier
  userId?: string          // Actor identifier (optional for system-triggered events)
  correlationId: string    // Trace identifier spanning the entire request lifecycle
  idempotencyKey: string   // Deduplication key
  payload: TPayload        // Strongly typed, Zod-validated payload
}
```

### Contract Evolution & Compatibility
- When payload schemas change in incompatible ways, the `version` field is incremented (`version: 2`).
- Consumers must inspect `envelope.version`. During migrations, consumers temporarily support both versions before deprecating the older format.
- Unversioned or malformed envelopes are rejected immediately as `TERMINAL` errors.

---

## 4. Idempotency & Deduplication

Because Cloudflare Queues may redeliver messages upon network timeouts or worker restarts, consumers prevent duplicate side-effects (e.g. sending duplicate emails or double-incrementing counters) using atomic idempotency keys.

### Idempotency Key Formats
- **Entity State Transitions**: `attempt:{attemptId}:completed`
- **Scheduled Reminders**: `reminder:{reminderType}:{userId}:{timestampWindow}`
  *(e.g., `reminder:revision:usr_456:2026-10-24T14:00`)*
- **Import Jobs**: `import:{jobId}:batch:{batchIndex}`

### Atomic Execution Pattern
```typescript
// Consumer execution pseudocode
async function processQueueMessage(message: Message<QueueEnvelope<Payload>>) {
  const envelope = message.body
  const { eventId, idempotencyKey } = envelope

  // 1. Attempt atomic claim in PostgreSQL
  const claimed = await db.claimIdempotencyKey(idempotencyKey, eventId)
  if (!claimed) {
    // Already executed or in progress by another worker
    message.ack()
    return
  }

  try {
    // 2. Execute bounded domain operation
    await domainService.execute(envelope.payload)

    // 3. Mark idempotency record as completed
    await db.completeIdempotencyKey(idempotencyKey)
    message.ack()
  } catch (error) {
    const classification = classifyError(error)
    if (classification.classification === "RETRYABLE") {
      message.retry()
    } else {
      // Terminal failure: route to DLQ, do not retry indefinitely
      await forwardToDlq(envelope, classification)
      message.ack()
    }
  }
}
```

---

## 5. Retry Classification & Error Handling

Consumers explicitly categorize failures into two distinct types via `classifyError()`:

```text
┌─────────────────────────────────┐
│        CONSUMER FAILURE         │
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
 ┌─────────────┐   ┌─────────────┐
 │  RETRYABLE  │   │  TERMINAL   │
 └──────┬──────┘   └──────┬──────┘
        │                 │
        ▼                 ▼
 • Network timeout  • Schema validation error
 • HTTP 429 / 503   • Invalid contract version
 • DB pool busy     • Resource deleted/not found
 • Provider offline • Auth permanently invalid
        │                 │
        ▼                 ▼
  message.retry()   message.ack() + route to DLQ
```

### Dead-Letter Queue (DLQ) Strategy
When a message reaches `max_retries` or encounters a `TERMINAL` error:
1. The message envelope and error diagnostic context are published to the dead-letter queue.
2. An error log is emitted via `WorkerLogger` with the `correlationId`, `eventId`, and error classification.
3. Poison pills cannot cause infinite retry loops that starve valid queue traffic.

---

## 6. Scheduled Orchestration (Cloudflare Cron)

Scheduled background jobs are triggered by Cloudflare Cron Triggers:

| Schedule Name | Cron Expression | Purpose | Work Pattern |
|---|---|---|---|
| `revision-reminders` | `0 * * * *` (Hourly) | Identify spaced repetition due items | Query due window → Enqueue batch |
| `daily-planner` | `0 * * * *` (Hourly evaluation) | Evaluate morning plan triggers per timezone | Fan out planning triggers |
| `weekly-review` | `0 6 * * 1` (Monday 06:00 UTC) | Generate weekly preparation summaries | Enqueue review generation jobs |

### The Bounded Workload Fan-Out Rule
Cron triggers **must never process users or entities inline**:

```text
ANTI-PATTERN (Fails at scale):
Cron Trigger → Loop through 50,000 users inline → Timeout (Error 1101)

CORRECT ARCHITECTURE (Scales indefinitely):
Cron Trigger (fires hourly)
     ↓
Query PostgreSQL for bounded due batch (limit 500)
     ↓
Publish discrete task envelopes to 'notifications' queue
     ↓
Acknowledge Cron execution (< 3 seconds)
     ↓
Queue Workers scale horizontally and process tasks concurrently
```

---

## 7. Timezone-Aware Scheduling

PrepCraft users prepare across global regions (e.g., `Asia/Kolkata`, `America/New_York`, `Europe/London`).
- All database timestamps and queue envelope `occurredAt` fields are strictly stored in **UTC**.
- Workspaces and user preferences store their canonical **IANA timezone** (`Asia/Kolkata`).
- Hourly cron jobs evaluate whether the current UTC hour corresponds to the user's configured morning reminder hour in their local timezone:
  $$\text{Target Local Hour (e.g. 08:00)} = \text{Current UTC Time} \text{ converted to candidate IANA timezone}$$
- Reminders are dispatched within the candidate's actual morning preparation window, never defaulting to raw UTC midnight.
