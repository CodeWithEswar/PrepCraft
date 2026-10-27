# 0018: Deterministic planning and rebalance proposals

Status: Accepted

Use pure, versioned capacity/allocation rules. Every generated placement or move includes a reason. Proposals include the input revision/fingerprint; accepting one rechecks current state and applies the reviewed change atomically with an idempotency key.

Unreviewed material changes, random placement, UI-local heuristics and AI scheduling were rejected. The user sees before/after loads, moved and protected work, and unresolved conflicts before accepting changes.
