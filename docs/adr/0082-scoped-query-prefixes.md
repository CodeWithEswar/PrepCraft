# 0082 — Centralize query scope

Status: accepted for the current platform implementation.

Personal cache keys contain user and workspace identity. Preserve stable existing key shapes and invalidate only affected domains.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
