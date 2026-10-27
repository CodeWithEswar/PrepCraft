# 0085 — Separate local preview and production

Status: accepted for the current platform implementation.

Use emulated local storage and explicit live-development opt-in. Reject the production backend in Vercel preview; production origin is prepcraft.vercel.app.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
