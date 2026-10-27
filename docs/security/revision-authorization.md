# Revision Authorization

Every Revision table enables and forces RLS. Authenticated SELECT requires the matching user plus current active workspace membership. Another member in the same workspace cannot read private recall history. Anonymous table/function grants and direct client writes are revoked.

Public RPCs are security invoker wrappers. Private security-definer implementations have empty search paths, schema-qualified relations, live auth.uid checks, active membership, workspace and owned-item lookup. Writes reject inactive/archived workspaces. Active members manage their own Revision evidence without receiving workspace target/plan administration rights.

Composite FKs preserve workspace/user scope across source prompts, attempts, sessions, snoozes and events. Internal trigger/consumer functions cannot be invoked directly by authenticated, anonymous or service roles. No service-role credential is used in the browser.

Zod and PostgreSQL bound/validate mutations. Locks, versions and request hashes prevent stale/replayed changes. Only committed Execution evidence can complete a review. Telemetry includes status codes/timings, never prompt content, snooze reasons or reflections.

Database tests cover cross-workspace writes, same-workspace private reads, anonymous rejection, direct-write denial, duplicate delivery, stale versions, session conflicts and snooze recovery.
