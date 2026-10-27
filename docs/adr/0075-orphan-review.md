# 0075 — Observe unknown R2 objects conservatively

Status: accepted for the current platform implementation.

Record unknown keys in bounded scans. Do not automatically delete unknown objects because uncertain writes and operator recovery can temporarily diverge.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
