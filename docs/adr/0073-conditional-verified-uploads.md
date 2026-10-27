# 0073 — Verify bytes before READY

Status: accepted for the current platform implementation.

Bound size, inspect MIME signatures, verify SHA-256 and conditionally create the object. Metadata cannot become READY after access revocation or an unverified write.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
