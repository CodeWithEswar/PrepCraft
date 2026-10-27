# Outbox backlog

Inspect pending/publishing/queued/processing jobs, lease expiration and oldest due age under a service identity. The canonical attempt_outbox_events record must remain intact.

A lost queue acknowledgment is safe to redeliver. Resolve dependency errors, let Cron reclaim expired leases and review exhausted failures. Do not mark jobs done without confirming the side effect. For a terminal failed job use the audited replay operation with the original event ID.
