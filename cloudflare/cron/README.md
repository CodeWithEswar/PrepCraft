# Cloudflare Cron Triggers — Scheduled Orchestration Contract

PrepCraft uses scheduled Cloudflare Cron Triggers for time-sensitive preparation workflows, spaced repetition reminders, daily plan generation, and weekly review summaries.

---

## 1. Planned Cron Schedules

| Schedule Name | Cron Expression | Purpose | Work Pattern |
| --- | --- | --- | --- |
| `revision-reminders` | `0 * * * *` (Hourly) | Find due spaced-repetition questions | Identify & enqueue batch to `notifications` |
| `daily-planner` | `0 0 * * *` (Midnight) | Generate daily plan candidates | Enqueue workspace planning triggers |
| `weekly-review` | `0 6 * * 1` (Monday 06:00 UTC) | Aggregate candidate weekly preparation digest | Enqueue digest generation jobs |

---

## 2. Bounded Workloads Principle

Cron triggers must NOT process all PrepCraft users or records synchronously in a single execution.
Synchronous multi-user loops fail at scale due to worker CPU and runtime limits.

### Architectural Rule: Fan-Out via Queues
```text
Cron Trigger fires
      ↓
Query bounded batch of due workspace/user IDs (e.g. limit 200)
      ↓
Publish messages to Queue ('notifications' or 'planning')
      ↓
Acknowledge Cron execution (< 5 seconds)
      ↓
Queue consumers process batches concurrently in bounded chunks
```

---

## 3. Occurrence-Based Idempotency

Scheduled triggers may fire repeatedly or retry upon transient network timeouts.
To prevent duplicate notifications (e.g., sending two identical reminder emails to a candidate):

1. **Deterministic Idempotency Key**:
   Every enqueued reminder task uses an occurrence key:
   ```text
   reminder:{reminderType}:{entityId}:{scheduledWindow}
   ```
   Example:
   `reminder:revision:usr_456:2026-10-24T14:00`
2. **Deduplication Check**:
   Before dispatching any notification, the consumer claims the occurrence key in PostgreSQL. If already claimed, dispatch is skipped.

---

## 4. Timezone Awareness

Candidates prepare across global time zones (e.g., `Asia/Kolkata`, `America/New_York`, `Europe/London`).
- Never assume midnight in UTC represents the start of the user's day.
- Candidate workspaces store their configured IANA time zone (e.g., `Asia/Kolkata`).
- Hourly cron jobs evaluate whether the current UTC time corresponds to the candidate's preferred morning reminder window in their local time zone.
