# Today projection and explainability

`assembleToday` consumes authorized context, a plan, task projections and typed domain contributions. It validates every task, focus segment and event against the workspace ID and rejects a scope mismatch rather than filtering it away silently.

Contribution ports receive `{ workspaceId, dayKey, timezone, now }`. Revision provides due obligations and counts; focus provides completed time intervals; Readiness provides its own compact evidence-backed summary; upcoming provides recorded events. Mastery and target alignment arrive as normalized source evidence attached to candidates. An absent port returns unavailable values, while an independently failed port returns an error state. A weekly source failure cannot destroy Next Best Action.

Every eligible task has at least one reason. Structured codes such as REVISION_DUE, OVERDUE, WEAK_TOPIC, TARGET_CRITICAL, INTERVIEW_SOON, OA_SOON and SCHEDULED_TODAY map to version-controlled copy. The context ribbon shows the two most meaningful reasons and the estimate. Priority Trace shows the full explanation and bounded diversity adjustments in a desktop Popover or mobile Drawer. Internal numbers are not presented as user explanations.

Calendar keys use the workspace IANA timezone and stable `YYYY-MM-DD` values. Focus segments are unioned to avoid double counting and split at local midnight, including DST's 23- and 25-hour days. Today and last-week totals remain distinct. Session elapsed time, completed task estimates and focused time are never interchangeable.

Initial reads are server-first. TanStack Query is seeded with the server snapshot and uses `['workspaces', workspaceId, 'today', dayKey]`; this fits the existing workspace-switch cache eviction boundary. Mutations update confirmed snapshots. The client checks the day on visibility changes and every 30 seconds, then blocks stale-day controls and refreshes the server route. No personalized snapshot uses a public shared cache.

The present adapters intentionally declare missing domains unavailable. Connecting a future source requires a workspace-authorized provider plus its domain-owned completion contract. It does not justify creating shadow revision, mastery, readiness, interview or focus tables in Today.
