# Worker / queue failure runbook

This is the operating contract for future workers; none are deployed yet.

1. Identify the worker, environment, version, queue, event ID and correlation ID without collecting raw payloads.
2. Inspect error rate, queue age/depth, retries, dead-letter counts and authoritative outbox state.
3. Separate malformed/unsupported-version messages from transient dependency failures. Quarantine poison messages; avoid infinite retry loops.
4. Confirm idempotency state and external side effects before replay. Replay with the original event/operation identity so duplicate effects are suppressed.
5. Roll back an incompatible worker only when its supported envelope versions and database contract remain compatible. Keep old versions readable during transitions.
6. Record a sanitized incident summary and a regression fixture. Verify backlog drains and alerts recover before closing the incident.

Never delete authoritative PostgreSQL state to silence a queue error. Acknowledgement, retry and DLQ procedures must be exercised in worker-runtime tests before the first live workload.
