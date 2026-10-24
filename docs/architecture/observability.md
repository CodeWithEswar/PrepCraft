# Observability Plane Architecture — Telemetry, Logging & Distributed Tracing

The Observability Plane spans all four operational planes in PrepCraft (Experience, Application, Data/Identity, and Async/Edge). It enables engineers to understand runtime behavior, diagnose exceptions, track performance latency, and safely investigate failures without exposing sensitive candidate data.

---

## 1. Core Observability Questions

Every telemetry event, log record, and error trace must answer five fundamental operational questions:

1. **What happened?** *(Operation name and outcome: success, retryable failure, terminal failure)*
2. **For which operation?** *(Distinct capability: e.g. `completeAttempt`, `dispatchReminders`, `scheduleRevision`)*
3. **Where did it fail?** *(Specific plane and component: Client, Next.js Server Action, PostgreSQL, Cloudflare Worker, or External Provider)*
4. **Was it a transient or permanent error?** *(Determines whether the system should retry or alert)*
5. **How can the trace be correlated end-to-end?** *(Consistent `correlationId` linking the HTTP request to queue messages and worker executions)*

---

## 2. Multi-Tier Telemetry Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    EXPERIENCE PLANE (BROWSER)                │
│                                                              │
│  Sentry Client SDK:                                          │
│  • Client-side unhandled exceptions                          │
│  • Core Web Vitals (LCP, FID, CLS, INP)                      │
│  • Route transition latency                                  │
│  • PII scrubbing enabled (sendDefaultPii: false)             │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ HTTPS / correlationId
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    APPLICATION PLANE (NEXT.JS / VERCEL)      │
│                                                              │
│  Sentry Server SDK + src/lib/observability/logger.server.ts: │
│  • Server Action & Route Handler performance traces          │
│  • Structured JSON logs with sanitized context               │
│  • Explicit error classification (OperationErrorCode)        │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ Queue Envelope (correlationId)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    ASYNC & EDGE PLANE (CLOUDFLARE)           │
│                                                              │
│  cloudflare/shared/observability/structured-logger.ts:       │
│  • Worker execution latency & queue batch metrics            │
│  • Structured JSON logs via WorkerLogger                     │
│  • Automatic redaction of credentials and auth headers       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ Activity Log (eventId)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    DATA PLANE (SUPABASE POSTGRESQL)          │
│                                                              │
│  Append-Only Activity Events & PostgreSQL Metrics:           │
│  • Immutable activity_events table for candidate actions     │
│  • Slow query monitoring (pg_stat_statements)                │
│  • Connection pool saturation & lock contention metrics      │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. End-to-End Correlation Taxonomy

A single candidate action is traceable across all systems via correlated identifiers:

```text
HTTP Request (Browser)
    │
    ▼ (Generates UUIDv4: requestId / correlationId)
Next.js Server Action (/src/features/attempts/server/mutations.ts)
    │
    ▼ (Generates UUIDv4: eventId for question.attempt.completed)
PostgreSQL Transaction (Inserts attempt + appends activity_events)
    │
    ▼ (Enqueues QueueEnvelope containing eventId & correlationId)
Cloudflare Queue ('prepcraft-prod-analytics-events')
    │
    ▼ (Worker logs correlationId and eventId)
Cloudflare Worker ('analytics-processor')
```

If an error occurs inside the Cloudflare Worker, engineers can search the `correlationId` or `eventId` to trace the originating user action, server mutation timestamp, and database transaction.

---

## 4. Structured Logging Standard

All server and worker logs emit structured, single-line JSON with standard field names:

```json
{
  "timestamp": "2026-10-24T16:00:00.000Z",
  "level": "INFO",
  "service": "prepcraft-app",
  "worker": "reminder-dispatcher",
  "operation": "dispatchReminders",
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "eventId": "223e4567-e89b-12d3-a456-426614174001",
  "workspaceId": "323e4567-e89b-12d3-a456-426614174002",
  "durationMs": 45,
  "outcome": "success",
  "errorCategory": null,
  "message": "Enqueued 12 due revision reminders"
}
```

---

## 5. Strict Credential & PII Redaction Rules

Logs must never contain sensitive credentials or private user assets. The log sanitization utility (`sanitizeLogData`) automatically replaces sensitive keys with `[REDACTED]`:

### Strictly Prohibited in Logs
- Passwords, password hashes, and recovery tokens.
- OAuth tokens, refresh tokens, and session JWTs.
- `SUPABASE_SERVICE_ROLE_KEY` or database connection strings.
- `Authorization`, `Cookie`, and `Set-Cookie` headers.
- Full private resume contents or resume binary bytes.
- User code submissions (unless explicitly sanitized and required for compiler error diagnostics).

---

## 6. Performance Budgets & Alerting

Observability monitors critical performance metrics against defined budgets:

| Surface / Metric | Performance Target | Critical Alert Threshold |
|---|---|---|
| **Server Component First Byte (TTFB)** | $< 250\text{ ms}$ | $> 1,000\text{ ms}$ |
| **Server Action Execution** | $< 150\text{ ms}$ | $> 750\text{ ms}$ |
| **Queue Consumer Execution** | $< 500\text{ ms}$ per batch | $> 3,000\text{ ms}$ |
| **Dead-Letter Queue (DLQ) Depth** | $0\text{ messages}$ | $> 5\text{ messages in 15 mins}$ |
| **Database Connection Pool Usage** | $< 60\%$ of pool | $> 85\%$ of pool |
