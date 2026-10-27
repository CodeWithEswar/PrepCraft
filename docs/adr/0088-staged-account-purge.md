# 0088 — Design account deletion as a staged purge

Status: accepted for the current platform implementation.

Revoke sessions and enforce an account barrier before byte cleanup, relational purge and Auth deletion. Do not execute account deletion as part of infrastructure setup.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
