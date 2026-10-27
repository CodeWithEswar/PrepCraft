# Behavioral authorization and privacy

All ten public Behavioral tables enable and force RLS. Authenticated roles receive scoped SELECT; anonymous access and direct client writes are denied. Owned rows require auth.uid() and active workspace membership, including same-workspace isolation between different users. Composite foreign keys prevent associating another user's story/session/item. Custom frameworks are scoped to the creating workspace and user. Published platform content is immutable.

Public RPC wrappers are SECURITY INVOKER. Private SECURITY DEFINER implementations use an empty search_path and the existing Revision access/locking authority before reads or writes. Mutations lock workspace then story/session and validate optimistic versions and idempotency hashes. Archived workspaces remain readable but cannot mutate. No service-role credential reaches the browser.

Full STAR text, private notes, cue bodies, reflections and working notes never enter logs or analytics/outbox payloads. Behavioral events contain bounded command hashes, identifiers and safe responses, not raw commands. The practice endpoint withholds prepared text until cue use is persisted. Owners can still read their own original stories; cue tracking describes self-practice rather than an anti-cheat system.

Browser-local drafts contain private content and are keyed by workspace/user/story or session. They are not transmitted as analytics. Users should discard them on shared devices. There is no permanent-delete UI; account/workspace deletion retains the existing platform policy, and canonical publication guards do not block custom-framework cascade deletion.
