# Attempt event contract

The final debrief transaction saves the attempt and inserts one `attempt.completed` outbox row. Its payload includes attempt/workspace/session/item IDs, reported result, confidence, controlled mistake categories, hint evidence and commit time. It excludes code, scratchpad, approach and private reflection text. Session activity events record meaningful transitions, never timer ticks; technical draft receipts are omitted from the user-facing trace.

Revision, Mastery and Mistake Journal own their consequences. Their consumers are not implemented in this repository. Events therefore remain durably pending, and the UI does not claim scheduled revision, calculated mastery or automatic mistake aggregation. No unused external queue/worker is provisioned. A future dispatcher must deliver at least once, and a consumer must deduplicate by event ID plus its policy before acknowledgement. `deliverAttemptEvent` tests acknowledgement only after successful consumption and demonstrates retry-safe consumer contracts.

Today/Planning cache invalidation follows confirmed session/evidence changes. Actual focus is a shared infrastructure projection with no feature dependency cycle. Planning follow-ups resolve an owned completed attempt at the route composition boundary, then use Planning's existing task form and transaction. Execution does not copy Today ranking or write arbitrary scheduling rows from a form.

Existing allowlisted structured logging captures launch and mutation rejection/failure without private text. No Sentry DSN is configured, so external telemetry delivery is not claimed. Correlation and alerting infrastructure can be added through the existing observability boundary when configured.
