# 0086 — Repair the audited workspace RPCs narrowly

Status: accepted for the current platform implementation.

Bind bootstrap identity and revoke specifically audited anonymous grants while preserving function OIDs and authenticated contracts. Broad relocation was rejected by automatic review because of compatibility and authorization impact.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
