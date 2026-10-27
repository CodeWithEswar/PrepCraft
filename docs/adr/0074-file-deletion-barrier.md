# 0074 — Confirm bytes before metadata deletion

Status: accepted for the current platform implementation.

Keep DELETING durable until idempotent R2 deletion is confirmed. Block workspace deletion while live file metadata remains.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
