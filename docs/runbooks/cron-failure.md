# Cron failure

Compare current time with platform_worker stats runtime.lastDispatchAt. Verify the deployed Worker schedule is */5 * * * * and encrypted credentials are present. Inspect sanitized dispatch failures in Cloudflare logs.

Repair configuration and redeploy the verified artifact. Durable jobs remain in Postgres. A successful health endpoint proves liveness only, not successful Cron or database access. Confirm the heartbeat advances before resolving the incident.
