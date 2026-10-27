# Cloudflare resources

The production platform Worker binds prepcraft-private-files, a per-location transfer limiter, prepcraft-platform-jobs and its DLQ. Cron runs every five minutes. The preview bucket prepcraft-preview-files is separate and private; it has no configured production service identity.

The existing notification delivery/report queues remain unchanged. Unrelated account resources must never be altered by PrepCraft commands.

Batches are five database jobs, five file checks and five object-list entries per scheduled platform invocation, keeping combined subrequests bounded on the existing account plan. No paid plan upgrade is assumed.
