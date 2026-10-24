# Cloudflare infrastructure

This root owns portable contracts and future Workers/Queues/Cron/R2/KV infrastructure. It is not a second application database. PostgreSQL remains authoritative.

Current executable foundation: `shared/contracts/queue-envelope.ts` and its unit test. Run `npm run test` from the repository root. No worker entry point or Wrangler configuration exists because this phase has no justified edge workload; no deployment command should be invented for an empty service.

When the first workload is implemented: create its worker directory, add a versioned Wrangler configuration and generated binding types, validate its environment, add worker-runtime tests and define idempotency/retry/DLQ behavior. Use `wrangler dev --local` only after that configuration exists; do not enable remote bindings unintentionally. Secrets live in ignored `.dev.vars` locally and Wrangler secrets on the target environment.

The [architecture document](../docs/architecture/cloudflare.md) defines future worker/queue/cron ownership, R2 metadata separation and security. [ADR 0002](../docs/adr/0002-cloudflare-async-plane.md) records why these workloads are separate from the Next application.
