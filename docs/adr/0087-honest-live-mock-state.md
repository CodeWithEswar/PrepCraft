# 0087 — Do not simulate live persistence

Status: accepted for the current platform implementation.

Live mock routes must not use preview data or claim saved answers without a database transaction. Keep a clear unavailable state and the isolated preview until persistence is implemented.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
