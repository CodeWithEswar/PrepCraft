# Revision Events

Scheduling is synchronous at current scale. Execution commits reflection plus attempt.completed to its transactional outbox. A private trigger consumes the actual owned question_attempts row in that transaction; it never trusts copied event payloads. Unique revision_attempts.source_attempt_id is the durable receipt. Duplicate delivery cannot advance intervals twice.

The schedule, immutable evidence and sanitized domain event commit atomically. A failure rolls back the debrief rather than claiming a saved schedule. The Execution outbox remains for other consumers; Revision does not acknowledge Mastery/Analytics. Payloads contain IDs, interval/date and policy, never code, private notes or reflections.

Events include scheduled, reviewed, started, snoozed, unsnoozed, retired and restored. Locks, current versions, request UUID and command+item hash protect concurrent tabs. Starting twice resumes the linked active session or unfinished reflection. A different active session is returned explicitly for recovery, without a new review link.

No Cloudflare queue, D1, KV, Cron or production background resource is introduced. Future asynchronous processing must preserve receipts and ownership and be justified by measured scale. Reconciliation processes at most 100 owned missing completed attempts chronologically per call. Late evidence cannot replace a newer schedule.
