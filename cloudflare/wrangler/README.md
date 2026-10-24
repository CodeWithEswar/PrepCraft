# Wrangler Environment Configuration Contract

This directory documents and templates environment-specific Cloudflare resource configuration for PrepCraft across development, staging, and production tiers.

---

## 1. Environment Resource Isolation

Resources across development, staging, and production are strictly isolated to prevent cross-environment state corruption:

| Environment | Queue Prefix | R2 Bucket Name | KV Namespace |
| --- | --- | --- | --- |
| **Development** | `prepcraft-dev-*` | `prepcraft-dev-files` | `prepcraft-dev-cache` |
| **Staging** | `prepcraft-staging-*` | `prepcraft-staging-files` | `prepcraft-staging-cache` |
| **Production** | `prepcraft-prod-*` | `prepcraft-prod-files` | `prepcraft-prod-cache` |

---

## 2. Secrets Management Rules

1. **NEVER Commit Secrets**: Secrets must NEVER appear in `wrangler.toml`, Git repositories, or CI logs.
2. **Local Development**: Use `.dev.vars` (which is included in `.gitignore`):
   ```text
   SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
   INTERNAL_SERVICE_SECRET=your_local_shared_secret
   ```
3. **Staging & Production**: Use Cloudflare's secure secret store:
   ```bash
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env staging
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
   ```

---

## 3. Configuration Template

Below is the standard Wrangler configuration template for PrepCraft workers:

```toml
name = "prepcraft-worker"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "development"
SUPABASE_URL = "http://localhost:54321"

# Development Queues
[[queues.producers]]
queue = "prepcraft-dev-analytics-events"
binding = "ANALYTICS_QUEUE"

[[queues.consumers]]
queue = "prepcraft-dev-analytics-events"
max_batch_size = 50
max_batch_timeout = 5
max_retries = 5
dead_letter_queue = "prepcraft-dev-analytics-events-dlq"

# Development Storage
[[r2_buckets]]
binding = "FILES_BUCKET"
bucket_name = "prepcraft-dev-files"

# Staging Environment Override
[env.staging]
name = "prepcraft-worker-staging"
vars = { ENVIRONMENT = "staging", SUPABASE_URL = "https://staging.supabase.co" }

# Production Environment Override
[env.production]
name = "prepcraft-worker-production"
vars = { ENVIRONMENT = "production", SUPABASE_URL = "https://app.supabase.co" }
```
