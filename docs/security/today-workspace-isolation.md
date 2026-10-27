# Today authorization boundary

Every protected Today route resolves an authenticated user, workspace slug and active membership on the server. Every mutation re-resolves that boundary. Route parameters, task UUIDs and client snapshots are not authorization claims.

`daily_plans`, `daily_tasks` and `today_activity_events` have enabled and forced RLS, and member SELECT policies use the existing indexed membership helper. Anonymous reads and direct authenticated table writes are revoked. Composite task/plan foreign keys enforce workspace consistency; completion timestamp and source constraints reject invalid states.

The public mutation RPC is SECURITY INVOKER. It delegates to a single private, explicitly authenticated SECURITY DEFINER writer because clients intentionally have no direct table write privileges. Its empty search path and fully qualified identifiers prevent object shadowing. PUBLIC/anonymous/service-role execution is revoked; only authenticated callers can reach it. It validates live membership and active workspace state, locks authorization and plan/task rows, validates local date and versions, and commits state plus activity in one transaction. Private schema usage does not expose it through the Data API.

Custom-task completion cannot mark a source revision, practice, study or interview task complete. Future source domains must provide transaction-safe completion operations. Deferring a source projection retains the original source deadline. No service-role key is used by application reads or mutations.

Local SQL execution tests cover member reads, unrelated workspace reads/writes, disabled members, anonymous access, direct API writes, composite foreign keys, estimates, completion consistency, idempotence, conflict rejection, rollback and archived workspaces. Test identities exist only in an ephemeral embedded PostgreSQL instance. The linked project's tables and grants were separately checked after the user-authorized CLI push; this was not a live end-user account E2E.
