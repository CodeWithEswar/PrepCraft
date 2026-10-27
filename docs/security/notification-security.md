# Notification security

Every public entity has enabled and forced RLS. SELECT is explicitly granted to authenticated users under owner/live-membership policies; direct writes are revoked. Mutations are guarded private functions behind invoker facades. Anonymous execution and private-helper execution are explicitly revoked, including PostgreSQL's default PUBLIC grant. Public subscription reads expose metadata only.

Input validation occurs in Zod and again in PostgreSQL. Bulk selection is all-or-nothing and capped at fifty. The scheduler, source resolver, report builder and Worker API never accept a client-supplied user ID as authority. Workspace membership is checked at read, mutation, dispatch and delivery time. Source destinations use an action enum and validated workspace slug; arbitrary URLs are not opened.

The Worker secret is a project-privileged service credential, not a browser key. It is held only in encrypted Cloudflare secrets and ignored local development variables. The Worker exposes no arbitrary RPC proxy. Rotate the credential if it is exposed and restrict operator access. Never commit .dev.vars, environment files, provider payloads or push keys.

Email HTML escapes account text; verified auth email is looked up after claim. Resend webhooks verify the raw body, Svix HMAC, event ID and a five-minute timestamp window before accepting an event. Provider receipts are unique and acceptance is distinguished from provider delivery/bounce status. Push targets use a strict host allowlist and reject redirects to prevent SSRF.

Report snapshots exclude code, answers, notes and STAR text, stay owner-scoped, and cannot change once ready. Queue bodies and logs carry identifiers/statuses, not personal contents. Metadata checks and revoked-member/foreign-user tests live in scripts/database/test-notifications.mjs and supabase/tests/sql/notifications-live-verification.sql.
