# Data ownership

Supabase owns membership, targets, plans, sessions, reflections, revision transitions, source evidence, notification records, file metadata, grants, audits and durable jobs. R2 owns immutable private file bytes. Queue messages carry identifiers, never business truth.

The existing attempt_outbox_events row is the canonical committed attempt event. A transaction trigger adapts its stable event ID into a platform job. The observer records an idempotent checkpoint; it does not invent another analytics or Mastery model.

Application and interview-tracker evidence is not authoritative in the current repository. Project readiness is unavailable. Live mock routes no longer return preview sessions or fake write confirmations.
