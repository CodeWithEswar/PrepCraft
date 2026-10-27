# Mastery Authorization

Every query authenticates and resolves an active workspace membership, then scopes source rows by workspace and user. The same user across different workspaces and different members of one workspace remain isolated. Public read RPCs are security invoker wrappers around private, fixed-search-path, live-authorized implementations. Anonymous execute is revoked.

No derived mastery table exists. The only new persisted metadata, execution_topic_attributions, enables and forces RLS. Authenticated reads require own user plus live workspace membership. Anonymous access and direct writes are revoked. Composite item/session/workspace/user FKs prevent forged attribution. Canonical topic IDs use the existing text catalog.

Attribution writes lock/re-authorize the workspace and membership, resolve an owned prompt, and verify the topic belongs to the pinned curriculum with inclusion overrides respected. Repeating the same assignment is idempotent; changing an existing association is a conflict. UI input is Zod bounded and verified against the effective curriculum again server-side. No service key enters the browser.

PostgreSQL tests cover same-workspace private reads, cross-workspace rejection, anonymous RPC denial, direct-write denial, unsupported windows, invalid curriculum topics, duplicate assignments and privacy-safe aggregate payloads. Live verification checks RLS/grants/functions only and does not return user evidence. Existing unrelated database advisor warnings are not described as a clean global security audit.
