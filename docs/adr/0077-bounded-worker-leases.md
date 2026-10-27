# 0077 — Bound publication and processing leases

Status: accepted for the current platform implementation.

Leases and durable retry counts recover from duplicate delivery and lost acknowledgments. Exhausted work remains inspectable and replays retain event identity.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
