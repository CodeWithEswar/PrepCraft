# Architecture — Domain Events, Activity History & Operational Signals

This document defines the event architecture of PrepCraft. It establishes the critical boundary between user-facing **Activity Events** and machine-to-machine **Operational Events**.

---

## 1. Activity Events vs Operational Events

PrepCraft strictly differentiates between two distinct categories of events:

```text
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│         ACTIVITY EVENT          │       │        OPERATIONAL EVENT        │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ • Product-visible historical    │       │ • Internal system coordination  │
│   accomplishment                │           signal                        │
│ • Stored in PostgreSQL          │       │ • Ephemeral message in          │
│   (activity_events table)       │           Cloudflare Queues             │
│ • Powers candidate activity     │       │ • Powers background tasks &     │
│   feed, streak, and timeline    │           downstream triggers           │
│ • Immutable business record     │       │ • Retried, acknowledged, or     │
│                                 │           routed to DLQ                 │
│ Examples:                       │       │ Examples:                       │
│ • question.attempt.completed    │       │ • notification.delivery.request │
│ • revision.completed            │       │ • analytics.batch.process       │
│ • interview.scheduled           │       │ • email.dispatch.send           │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

**Rule**: Never use ephemeral machine application logs as the user's product activity history. User-visible activity is an authoritative PostgreSQL ledger.

---

## 2. Canonical Domain Events Inventory

The following material domain operations emit versioned activity and operational events:

| Event Type Name | Primary Producer | Payload Summary | Activity Feed? | Async Queue Target |
|---|---|---|---|---|
| `workspace.created` | Workspace Onboarding | `workspaceId`, `ownerId`, `targetRole`, `targetDeadline` | Yes | `analytics-events` |
| `question.attempt.completed` | Practice Engine | `attemptId`, `questionId`, `durationMs`, `status`, `mistakes` | Yes | `analytics-events` |
| `revision.completed` | Spaced Repetition | `revisionId`, `questionId`, `rating`, `nextIntervalDays` | Yes | `analytics-events` |
| `study_session.completed` | Study Engine | `sessionId`, `trackId`, `durationMs`, `cardsReviewed` | Yes | `analytics-events` |
| `interview.scheduled` | Real Interview Tracker | `interviewId`, `company`, `roundType`, `scheduledAt` | Yes | `notifications` |
| `interview.completed` | Real Interview Tracker | `interviewId`, `company`, `roundType`, `outcomeVerdict` | Yes | `analytics-events` |
| `application.stage_changed` | Job Search Pipeline | `applicationId`, `fromStage`, `toStage`, `reason` | Yes | `analytics-events` |
| `resume.version_created` | Resume Manager | `resumeId`, `applicationId`, `versionNumber`, `fileId` | Yes | None (Metadata only) |

---

## 3. Versioned Event Envelope Contract

All cross-boundary asynchronous events conform to `QueueEnvelope<T>` (`CURRENT_ENVELOPE_VERSION = 1`):

```typescript
export interface QueueEnvelope<TPayload> {
  version: 1
  eventId: string          // UUIDv4 unique to this distinct event occurrence
  type: string             // Literal event name from the canonical inventory
  occurredAt: string       // ISO 8601 UTC timestamp with offset
  workspaceId: string      // Scoped tenant UUID
  userId?: string          // Originating actor UUID (optional for system events)
  correlationId: string    // Trace ID for end-to-end distributed tracing
  idempotencyKey: string   // Unique key for deduplication and idempotency claims
  payload: TPayload        // Zod-validated strongly typed payload
}
```

---

## 4. Delivery Guarantees & Transactional Integrity

1. **Transactional Integrity First**: Critical domain state changes (e.g. recording an attempt and scheduling a revision) commit to PostgreSQL before background event publishing.
2. **At-Least-Once Delivery**: Consumers on Cloudflare Queues must assume messages may be redelivered. Every consumer claims an atomic idempotency record in PostgreSQL before executing side effects.
3. **No Synchronous Coupling**: Server Actions must never hold open a user HTTP request waiting for queue consumers or external delivery webhooks.
4. **Retry Classification**: Consumers distinguish `RETRYABLE` (transient network, timeout, 429/503) from `TERMINAL` (schema validation error, unrecoverable data). Terminal failures are routed to a Dead-Letter Queue (DLQ).
