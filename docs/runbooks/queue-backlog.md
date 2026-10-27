# Queue backlog

Inspect Cloudflare queue metrics and service-only platform_worker stats. Compare oldest due age, failed counts and dispatcher heartbeat. Check resource bindings and Supabase dependency health before raising concurrency.

Resolve the dependency and allow expired leases to republish. Keep batches bounded on the current account plan. Do not delete queue messages to hide backlog, and do not create replacement business events with new IDs.
