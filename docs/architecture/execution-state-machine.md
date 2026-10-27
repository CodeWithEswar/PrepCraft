# Execution state and concurrency

Preflight is a local ready state. Explicit launch creates Active. Practice alone supports Active → Paused → Active. Finish or deadline expiry atomically closes active intervals, captures completion reason, freezes working state and creates pending attempts. Abandonment preserves saved work/time without manufacturing a solved outcome. Terminal sessions permit only appropriate reflection operations.

Policies are versioned and stored with sessions. Countdown modes cannot be paused at the database constraint or transaction layer. OA hints are forbidden; Interview's two-hint budget is checked transactionally. Current item ownership uses a composite deferred foreign key; session items, hints, focus, events and attempts retain workspace/user scope. Changing an item never changes expiry.

Launches serialize per workspace before a session exists, and a partial unique index enforces one active/paused session per user/workspace. Every action locks the session and checks its version. Request UUIDs and payload hashes make retries idempotent and reject identifier reuse with a different command. A late-write rejection envelope commits expiry before returning failure. Repeating that request stays rejected; it never becomes a falsely successful draft save.

Terminal timing and debrief are independent. Draft/reflection failures preserve entries and cannot restart a timer. Final attempt events deduplicate by attempt/event identity. Separate Today task completion failures produce a notice after the attempt is safely committed.
