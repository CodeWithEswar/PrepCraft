# 0071 — Postgres metadata and private R2 bytes

Status: accepted for the current platform implementation.

R2 holds immutable bytes; Postgres owns file state and authorization. No permanent public object URL is stored.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
