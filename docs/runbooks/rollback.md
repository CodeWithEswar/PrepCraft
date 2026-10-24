# Runbook — Safe Rollback Procedures

## Purpose
Provides verified step-by-step instructions for rolling back application deployments, database migrations, and Cloudflare workers during an operational incident.

## 1. Application Deployment Rollback (Next.js)
If a faulty deployment causes client crashes or server-side rendering errors:
1. Identify the last known good commit SHA on `main`.
2. Revert the commit via Git or redeploy the prior production build directly in the hosting dashboard.
3. Verify that the previous build is healthy:
   ```bash
   curl -I https://prepcraft.dev
   ```

## 2. Database Migration Rollback (Supabase)
**Rule**: Never mutate existing applied migration files.
1. Create a compensating rollback migration:
   ```bash
   supabase migration new rollback_<feature_name>
   ```
2. Write the inverse DDL (e.g. `drop table`, `drop column`, `drop policy`).
3. Test locally against the Supabase CLI:
   ```bash
   supabase db reset
   npm run db:check
   ```
4. Push and deploy the compensating migration through CI (`database-checks.yml`).

## 3. Cloudflare Worker Rollback
If a background worker or cron queue processor exhibits elevated error rates:
1. Re-deploy the previous worker version via Wrangler:
   ```bash
   wrangler rollback <worker-name> --version <version-id>
   ```
2. If queues are backed up with poison pills:
   - Route problematic messages to the Dead Letter Queue (DLQ).
   - Pause the queue consumer while fixing the ingestion parser.
