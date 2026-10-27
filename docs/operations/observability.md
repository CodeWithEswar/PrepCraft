# Observability

Sentry SDK adapters are wired for browser, Next server and both Workers. No DSN has been supplied, so external error reporting remains disabled. Do not claim events arrive at Sentry until a controlled error is verified in the actual project.

Error hooks rebuild an allowlisted event, dropping request bodies, headers, cookies, users, breadcrumbs, extras, SQL parameters and private messages. Browser/server transaction sanitizers remove queries, workspace paths, UUID paths and spans. Worker tracing is disabled. Session replay and logs are disabled.

Structured operational records use fixed event/code names and event/correlation/request IDs. platform_worker stats exposes only aggregate queue/runtime health to the service identity. Alert on a dispatcher older than fifteen minutes, failed jobs, growing due age and missing R2 objects. Logs are not an authoritative audit trail.
