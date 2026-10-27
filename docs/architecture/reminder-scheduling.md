# Reminder scheduling

private.notification_next is the one scheduling engine. Browser and Worker code do not independently compute recurrence. PostgreSQL validates IANA names and keeps UTC next_run_at plus local schedule fields. Recurrences use wall-clock dates, selected weekdays and minute precision.

PostgreSQL local-time conversion shifts spring gaps forward and selects the later fall-fold instant. The occurrence key includes reminder UUID and the normalized UTC scheduled instant, making a fold a single logical event. Once schedules can use a local date/time or absolute timestamp. Relative schedules follow authoritative task start or target-date 09:00.

The dispatcher locks reminder then schedule consistently, uses SKIP LOCKED, claims at most twenty-five due definitions, creates unique occurrence records and advances next_run_at in the same transaction. Recurring downtime coalesces to a bounded current occurrence; missed one-time windows expire after seven days. Availability processing and stale-source reconciliation are separately bounded to one hundred rows.

Quiet periods are evaluated again immediately before external delivery. A delayed job returns to a dated database outbox row and is acknowledged in Queues; it does not consume all delivery retries while waiting through a long snooze. Source changes and preference changes remain authoritative at wake-up.
