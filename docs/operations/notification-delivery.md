# Notification delivery operations

Build and validate: npm run typecheck; npm run architecture:check; node scripts/database/test-notifications.mjs; npx vitest run cloudflare/workers/notifications/notifications.test.ts tests/unit/notifications-policy.test.ts --maxWorkers=2; npx wrangler deploy --config cloudflare/wrangler/notifications.jsonc --dry-run. Apply the reviewed migration with Supabase CLI, then run notifications-live-verification.sql and database lint/advisors. Never edit a migration after it has been applied.

Resources are prepcraft-notifications, prepcraft-notification-delivery, prepcraft-notification-reports and their -dlq queues. Required encrypted secrets are SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Browser push additionally needs VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and a real HTTPS/contact VAPID_SUBJECT. No device is registered automatically.

EMAIL_ENABLED remains false. To enable email later, configure a real verified EMAIL_FROM, RESEND_API_KEY, HTTPS APP_ORIGIN and RESEND_WEBHOOK_SECRET; verify the sender domain and webhook URL, test accepted/delivered/bounced events, then explicitly change the flag. Resend idempotency keys last 24 hours, so ambiguous retries are limited to 23 hours. A local preview URL is not an email production origin.

Check the Worker health endpoint and Cloudflare Cron/Queue dashboards. Service-only notification_worker({kind:'ops.stats'}) returns aggregate runtime, delivery/report/outbox counts and oldest due age without account contents. Alert on a dispatcher heartbeat older than five minutes, growing due age, repeated dispatch_failed/job_retry logs, publication_exhausted, queue_exhausted and report generation failures. Alert destinations are an operator configuration step; none is fabricated by the app.

DLQ consumers persist terminal failure to Supabase. Inspect metadata and the current source before replay. Never reset delivered rows, ignore expired source windows, retry push_acceptance_unknown automatically, or move Resend first_attempt_at to extend its idempotency window. Fix configuration first. For a failed report, an operator may reset a nonready job's attempt counter after diagnosis; never modify a ready snapshot. Record the operator action and affected UUIDs in the incident record. Replay the same identifier envelope through its original queue after a reviewed database state repair.

Rollback external sending by setting EMAIL_ENABLED=false and removing/disabling push configuration, then deploy; in-app notifications remain independent. Retain immutable occurrence and provider receipts for investigation. Account/workspace deletion cascades owned data; application retention/deletion policy must be agreed before adding scheduled purges.

No real email send is part of this placeholder configuration. Web Push protocol, provider adapters, webhook verification and lifecycle behavior are tested with controlled fixtures, not unsolicited account messages.
