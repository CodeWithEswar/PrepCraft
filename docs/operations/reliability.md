# Reliability and recovery

Interactive writes use bounded transactions and remain independent of queue availability. External side effects use durable states, leases and idempotent finalization. Dependency timeouts are bounded. State stays recoverable after uncertain network outcomes.

The platform Cron is a dispatch/reconciliation trigger rather than a source of truth. Queue loss is recovered from expired job leases. DLQ records need an operator reason before replay. Unknown R2 objects are quarantined as observations rather than deleted.

RPO/RTO are not guaranteed by this implementation. Define backup retention, restore drills and alert destinations for the chosen Supabase plan before a production launch. Sentry activation, Vercel hosting and email delivery each require their own supplied configuration.
