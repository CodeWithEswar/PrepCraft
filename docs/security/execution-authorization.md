# Execution authorization

Sessions and evidence are owned by an explicit user within an authorized workspace. Membership alone does not expose another member's private code/notes. Every execution table enables and forces RLS, permits authenticated owner/member SELECT and revokes direct authenticated writes and anonymous reads. Unrevealed hint text has a stricter policy requiring an actual reveal record. OA cannot create that record.

Public RPCs are SECURITY INVOKER wrappers around fixed-search-path private transactions. Private launch/mutate/resolve recheck `auth.uid()`, live workspace/membership and session owner, lock relevant rows, validate source/state/mode/expiry and enforce version/idempotency guards. Session IDs do not confer access. Archived workspaces cannot accept user mutations. Source tasks must be authorized custom tasks on an active current-day plan.

Composite foreign keys retain session/workspace/user identity for items, hints, intervals, attempts and outbox evidence; current item references cannot cross session scope. Canonical pattern keys use the existing text catalog. Source snapshots and draft fields have bounded sizes; modes, statuses, outcomes, checklist/mistake values, timestamps and confidence have database constraints and Zod validation.

Working drafts use a device key containing user/workspace/session/item identity, with seven-day retention and removal after confirmed save/discard. Device storage is a recovery copy, never permission or timer authority. An explicit denied response removes the working session from the rendered UI; offline state cannot claim saves succeeded. Finalized rounds cannot accept a local draft reconciliation. No private text is sent to analytics or an external code runner.

`scripts/database/test-execution.mjs` executes real PostgreSQL migrations and role-based cases for cross-workspace, another same-workspace member, anonymous/disabled users, direct-write denial, hint secrecy, version races, duplicate commits, pause/hint policies and late expiry. Browser preview tests verify presentation without creating fake production attempts. Full Docker-backed Supabase/extension tests remain a CI responsibility.
