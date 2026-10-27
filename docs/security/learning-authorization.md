# Learning authorization

Every public learning RPC is SECURITY INVOKER wrapping an authenticated, workspace-scoped private contract. Workspace/membership lock order follows revision_access for writes. Published canonical content is authenticated-readable; private answers are ungranted, including to workspace owners. Direct content/state/binding writes are denied to authenticated/anon roles. Workspace owners are not platform authors.

All seven public tables enable and force RLS. Published concepts and activities filter their lifecycle; relation endpoints must be visible. State/binding reads require current user ownership and active workspace membership. Composite Execution item/session/workspace/user foreign keys prevent mixed-owner bindings. Notes, answer drafts and evaluation metadata cannot cross workspaces or mix same-workspace members.

Writes validate trusted scope, content identity, expected versions and request hashes. Shared Execution/Revision guards retain authoritative timers and immutable attempts. Server logs contain event names, timing/counts and error codes only, never note/code/answer text.

Verification: scripts/database/test-learning.mjs runs an ephemeral real PostgreSQL fixture, including cross-workspace/member RLS, draft filtering, hidden keys, evaluator bypass prevention, timeout, versioning, exclusions and EXPLAIN ANALYZE. Fixture plans are not scale benchmarks.
