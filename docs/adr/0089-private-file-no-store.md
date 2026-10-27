# 0089 — Keep file access uncached and attachment-only

Status: accepted for the current platform implementation.

Serve private bytes using no-store, nosniff and attachment disposition. Do not add inline HTML/SVG previews or claim malware scanning.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
