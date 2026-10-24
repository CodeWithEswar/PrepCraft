# Deployment and rollback

No deployment target is configured or published by Phase 03. CI builds the Next application and tests the architecture. Cloudflare is reserved for justified workers; this does not automatically choose Cloudflare as the Next hosting runtime. Select a compatible Next 16 host/runtime in an ADR before adding adapter-specific configuration.

Before deploying the application, set the real application origin, public Supabase settings when auth exists, and server secrets through the host's secret store. Build with the same public environment values intended for that deployment. Keep `/dev/brand` disabled in production. Run production asset/metadata checks and the relevant E2E journeys on the preview deployment.

Migrations use a separate controlled workflow with backups, staging validation and approval. No current CI job has deployment or production database credentials. Worker releases eventually require environment-specific bindings, versioned contracts and DLQ/retry verification.

Rollback: restore the last verified application release; assess whether its database schema and event contracts remain compatible. Do not blindly downgrade a deployed database or purge queued messages. Use forward repair migrations or a rehearsed restore when necessary. For a suspected secret leak, rotate/revoke first and follow the incident guidance in the threat model.
