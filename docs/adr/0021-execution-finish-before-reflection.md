# 0021: Timing ends before reflection begins

Status: Accepted

Finish atomically stops timing, closes active intervals and creates pending attempt evidence per session item. Reflection is a separate, recoverable explicit commit, so entering complexity, confidence or notes cannot inflate solve duration. Pending debrief drafts may be saved without committing a result. Final debrief outcomes are user-reported, and immutable after their event is committed in this phase.

One active/paused session per user and workspace is enforced by a partial unique index. Session ownership and active workspace membership are required for every action. Version guards and request UUIDs protect concurrent tabs and retries.
