# 0072 — Use scoped single-use transfer capabilities

Status: accepted for the current platform implementation.

Authorize a database-backed opaque grant and send it only in Authorization headers. This avoids distributing R2 API credentials and lets the Worker recheck current membership.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
