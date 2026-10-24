# Architecture — Activity & Asynchronous Events

## Purpose
Decouples primary transactional flows from downstream asynchronous processing (e.g. analytics derivation, notification dispatching, calendar sync).

## Canonical Domain Events
The following material user actions emit versioned events:

| Event Name | Producer | Payload Summary |
| --- | --- | --- |
| `workspace.created` | Workspaces | `workspaceId`, `ownerId`, `targetCompany`, `targetDeadline` |
| `question.attempt.completed` | Attempts | `attemptId`, `questionId`, `durationMs`, `status`, `mistakes` |
| `revision.completed` | Revision | `revisionId`, `questionId`, `rating`, `nextIntervalDays` |
| `interview.scheduled` | Interviews | `interviewId`, `company`, `roundType`, `scheduledAt` |
| `application.stage_changed` | Applications | `applicationId`, `fromStage`, `toStage`, `reason` |

## Event Envelope Contract
All cross-boundary asynchronous events conform to the standard envelope (`cloudflare/shared/contracts/queue-envelope.ts`):

```typescript
export interface QueueEnvelope<T> {
  version: number;
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  userId?: string;
  payload: T;
}
```

## Idempotency & Delivery Rules
1. **At-Least-Once Delivery**: Consumers on Cloudflare Queues must assume duplicate deliveries and maintain idempotency via `eventId` tracking.
2. **PostgreSQL Is Source of Truth**: Analytical queues produce derived read models or external alerts; authoritative operational records reside exclusively in Supabase PostgreSQL.
3. **No Synchronous Coupling**: Feature mutations must not block database transactions on network queue deliveries.
