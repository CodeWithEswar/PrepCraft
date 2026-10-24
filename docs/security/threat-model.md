# Trust boundaries and secrets

| Boundary / threat | Required control |
| --- | --- |
| Browser input → server | Feature Zod parsing, verified identity, rate limits where relevant; never trust hidden UI or route slugs |
| Workspace → another workspace | Active membership authorization plus PostgreSQL RLS; reject workspace reassignment on writes |
| Client bundle → infrastructure | `server-only`, explicit runtime imports and dependency traversal; only public Supabase credentials in public environment variables |
| Queue → consumer | Version/payload validation, durable idempotency, bounded retry/DLQ and correlation |
| File metadata → R2 bytes | Authorized short-lived access, private buckets, bounded object sizes/types and lifecycle checks |
| User code → execution runtime | Separate isolated provider, quotas/timeouts/network controls; no execution implementation in this phase |
| Logs / errors → user information | Allowlisted structured context, friendly typed results, no raw exceptions/SQL/cookies/tokens in responses |
| Dependency or config change | Lockfile, CI audit, least-privilege workflow permissions and review |

Environment variables are declared without values in `.env.example`. Marketing can run without Supabase. Supabase integration fails before constructing a client if public settings are absent/invalid or a privileged key is supplied. Never put service-role/secret keys, Cloudflare credentials, Sentry upload tokens or execution credentials in `NEXT_PUBLIC_*` variables. Current server configuration is parsed in `lib/env/server`; future integrations add their own narrowly scoped validation there.

`.env*`, worker `.dev.vars*`, private key files and local infrastructure state are ignored. Examples contain names only. Real deployments inject secrets through their secret store; no secret manager or credential is configured by this refactor.

Review limitations: static import checks do not prove absence of all data leaks. Review serialized props, outbound requests, logs, cache keys and response headers for every new integration. No public deployment or production database was changed in this phase.

Incident response: contain access, revoke/rotate affected credentials, preserve sanitized correlation evidence, determine affected workspace scope, notify responsible owners, restore service, and add a regression test. Never commit leaked values to an incident document. Coordinate user notification and retention with the deployment's applicable obligations.
