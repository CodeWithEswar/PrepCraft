# Revision Reconciliation

1. Confirm workspace/user and inspect metadata-only statuses/timings. Run live verification and advisors before changing grants or policies.
2. New debriefs schedule synchronously. For older completed attempts use Sync earlier evidence or authenticated reconcile_revision(slug). It consumes at most 100 missing receipts oldest first. Repeat only while the returned count is 100. Pending reflections and abandoned sessions are ineligible.
3. On conflict refresh the queue/detail; never bypass versions. Resume the linked Execution session or pending reflection before snoozing.
4. Identity/source-attempt uniqueness prevents duplicate effects; composite FKs prevent dangling scope. Account/workspace deletion deliberately cascades private history. Never repair source identity by matching titles.
5. Failed scheduling rolls back the debrief and remains retryable. Diagnose constraints/policy before repair; never manually increment intervals or acknowledge outbox events. Preserve historical inputs/outputs in additive reviewed migrations.

Run test:revision:db and portable tests after repairs. No periodic full-database scan or production Cron is configured. Introduce bounded background reconciliation only when measured backlog requires it.
