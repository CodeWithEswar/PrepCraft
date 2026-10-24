# Architecture — Domain Events & Asynchronous Architecture

## 1. Purpose & Boundary

Decouples primary transactional flows in Next.js Server Mutations from downstream background operations (e.g. analytics aggregation, spaced-repetition reminder dispatching, external notification delivery).

User-facing mutations commit their operational state to Supabase PostgreSQL immediately and do not block on slow asynchronous work.

---

## 2. Canonical Domain Events

The following material domain operations emit versioned events:

| Event Name | Producer | Payload Summary |
| --- | --- | --- |
| `workspace.created` | Workspaces | `workspaceId`, `ownerId`, `targetRole`, `targetDeadline` |
| `question.attempt.completed` | Attempts | `attemptId`, `questionId`, `durationMs`, `status`, `mistakes` |
| `revision.completed` | Revision | `revisionId`, `questionId`, `rating`, `nextIntervalDays` |
| `interview.scheduled` | Interviews | `interviewId`, `company`, `roundType`, `scheduledAt` |
| `application.stage_changed` | Applications | `applicationId`, `fromStage`, `toStage`, `reason` |

---

## 3. Versioned Event Envelope Contract

All cross-boundary asynchronous events conform to `QueueEnvelope<T>` (`cloudflare/shared/contracts/queue-envelope.ts`):

```typescript
export interface QueueEnvelope<TPayload> {
  version: 1
  eventId: string          // UUID identifying this distinct event occurrence
  type: string             // Literal event name
  occurredAt: string       // ISO 8601 UTC timestamp with offset
  workspaceId: string      // Scoped tenant UUID
  userId?: string          // Originating actor UUID (if user-triggered)
  correlationId: string    // Trace ID for end-to-end request tracing
  idempotencyKey: string   // Unique key for deduplication
  payload: TPayload        // Validated event payload
}
```

---

## 4. Delivery & Consumption Rules

1. **At-Least-Once Delivery**: Consumers on Cloudflare Queues must assume messages may be redelivered. Every consumer checks an atomic idempotency record before executing side effects.
2. **PostgreSQL Is System of Record**: Analytical workers produce derived read views or external notifications. Operational state resides exclusively in Supabase PostgreSQL.
3. **No Synchronous Coupling**: Server Actions must never hold open a user HTTP request waiting for queue consumers or external delivery webhooks.
4. **Retry Classification**: Consumers distinguish `RETRYABLE` (network, timeout, 429/503) from `TERMINAL` (schema validation error, unrecoverable data). Terminal failures are routed to a Dead-Letter Queue (DLQ).
