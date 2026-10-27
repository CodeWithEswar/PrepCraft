# 0083 — Debounce expensive interactive reads

Status: accepted for the current platform implementation.

Wait 250 ms for notification/revision search while retaining filter-specific query identities. Preview filtering remains local.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
