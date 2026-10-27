# 0078 — Require bounded operator replay reasons

Status: accepted for the current platform implementation.

Only the service identity can replay an exact failed job. Record its original event ID and a constrained reason before requeueing.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
