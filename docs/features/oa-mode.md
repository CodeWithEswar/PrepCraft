# OA mode

One session owns a fixed countdown and up to ten supplied questions. The preflight explicitly states duration, no pause, no hints, continued timing across refresh/navigation, and deadline finalization. Start OA is an explicit user action.

Question state distinguishes unseen, viewed, attempted and user-marked answered, with a separate flag. Answered is never treated as evaluated correct. Navigation closes/reopens the current active interval without changing the round deadline. The desktop navigator uses text/icons; mobile opens the same context in a Drawer with comfortable question targets.

Pause and hints are rejected in PostgreSQL, not merely hidden. Every working-state action checks expiry under a session row lock. A late write persists deadline finalization and returns a rejection envelope, so raising an exception cannot roll back expiry. The end time is the deadline, even if a browser was asleep. Each item receives pending evidence with its own active duration; it does not receive a copy of the full round duration.

Manual submission uses an AlertDialog showing how many questions were marked answered. Auto-expiry does not ask for confirmation. Previously confirmed code/answers remain frozen. Unsaved local drafts can be copied, but cannot alter a submitted or expired round. No per-second worker, cron, Realtime or KV timer is required; a dormant expired session is materialized at its next authorized resolution, and all projections cap time at its persisted deadline.
