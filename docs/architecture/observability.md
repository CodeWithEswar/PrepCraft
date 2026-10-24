# Observability and errors

`src/lib/observability/logger.server.ts` emits structured server logs. `log-record.ts` allows only event names and typed correlation/event IDs, outcome codes and durations. Unknown context is dropped, so callers cannot accidentally spread request bodies, cookies, tokens, SQL errors or email addresses into logs. Event names are fixed program identifiers, never user content.

Generate a correlation ID at a real request/job boundary when it is implemented; validate any inbound ID before accepting it. Carry it through typed operation results, queue envelopes and worker processing. The operation result contract deliberately separates expected validation/authorization/conflict outcomes from infrastructure/unexpected failures.

Sentry is the intended error-tracking integration, not installed or activated in this phase. Add its SDK and current Next/Worker setup when a deployed runtime exists, with environment-specific DSNs, server-only upload tokens, `sendDefaultPii: false`, explicit event scrubbing and source-map access controls. No telemetry is sent by this foundation. Workers will implement their runtime logger under `cloudflare/shared/observability` rather than importing the Next server logger.

Production dashboards should track errors, request latency, queue depth/age, retries, dead letters, job completion and outbox lag. Alert on actionable failures, never on raw user content. Retain only necessary metadata under an explicit retention/access policy. Logger allowlisting is unit-tested; real telemetry delivery and alert routing require deployment-specific tests later.
