# 0084 — Allowlist monitoring payloads

Status: accepted for the current platform implementation.

Rebuild Sentry events rather than blacklist known secrets. Disable private bodies, breadcrumbs, session replay and unneeded Worker tracing.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
