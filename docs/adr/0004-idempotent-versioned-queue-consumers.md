# 0004: Queue consumers are idempotent and versioned

**Status:** Accepted, 24 October 2026.

**Context:** Cloudflare Queues delivers messages with at-least-once semantics. Network retries, timeout delays, and consumer redeliveries can cause duplicate execution of downstream work (such as sending redundant reminder notifications, recording duplicate metrics, or performing multiple state transitions). In addition, event schemas evolve over time and consumers must avoid runtime corruption from mismatched message formats.

**Decision:**
1. Enforce versioned envelopes (`QueueEnvelope<T>`) validated at trust boundaries via Zod schemas (`CURRENT_ENVELOPE_VERSION = 1`).
2. Require atomic idempotency claims (keyed by `eventId` or `idempotencyKey`) before consumers execute side effects.
3. Explicitly classify errors into `RETRYABLE` (transient timeouts, network errors, rate limits) and `TERMINAL` (schema validation errors, unauthorized, malformed JSON). Terminal errors do not trigger infinite retry loops and are routed to a Dead-Letter Queue (DLQ).
4. Strictly separate scheduled cron triggers from synchronous user processing: cron triggers query due work and enqueue bounded batches onto queues.

**Alternatives Considered:**
- Assuming exactly-once queue delivery: Rejected because distributed queues inherently guarantee at-least-once delivery.
- In-memory deduplication (e.g. Set or cache): Rejected because worker instances restart and scale horizontally, leading to missed deduplication.
- Retrying all failures uniformly: Rejected because terminal schema bugs cause infinite poison-message retry cycles.

**Consequences:**
- Every asynchronous event producer and consumer must import shared contracts from `cloudflare/shared/`.
- Downstream database operations must support idempotency record persistence alongside domain state updates.
- Queue consumers remain robust, testable, and resilient against redelivery storms and payload drift.
