# 0076 — Reuse committed attempt events

Status: accepted for the current platform implementation.

Adapt attempt_outbox_events in its transaction, preserving event identity. The observer is a checkpoint rather than a duplicate analytics or Mastery engine.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
