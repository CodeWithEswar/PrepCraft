# Revision & Retention

Revision owns a persistent learning relationship, versioned schedule, immutable review evidence, and explicit overrides. It owns neither correctness nor Mastery/Readiness. The current source is Execution's session-local prompt identity; titles never infer that two prompts are the same question. Question Library, Mistake Journal, concept and flashcard integrations remain future adapters.

The authorized server routes are /w/[workspaceSlug]/revision and /revision/[revisionItemId]. The interface uses graphite/mineral rows, Smoked Sienna, the existing mountain focus asset, Hugeicons and shadcn primitives. The explicitly illustrative /preview/revision cannot persist evidence.

Next Revision, Recall Pressure reasons, 7/14/30-day Horizon, qualitative Retention Outlook, filters, Retention Thread, Memory Orbit and auditable snoozes expose the actual learning model. Container queries stack the schedule cards when the detail rail is narrow; mobile uses Drawers. Orbit targets are 44px, markers stay circular, and reduced motion removes interval animation.

A committed execution debrief schedules Revision synchronously in PostgreSQL. Starting revision reuses Practice timing, resolves owned prompt content without the previous answer, and preserves an explicit identity link. Finishing time, abandoning, or marking a task complete cannot count as recall. Saved attempts show committed next dates. Earlier attempts can be reconciled in bounded batches through Sync earlier evidence.

Today consumes Revision-owned candidates/counts; Planning consumes known due-date workload without changing learning dates. Estimates use recorded durations and remain unknown when absent. No target relevance, mistake count, mastery/readiness score or scientific retention probability is invented.

See [policy](../architecture/revision-policy.md), [events](../architecture/revision-events.md), [forecast](../architecture/revision-forecast.md), [queue](revision-queue.md), [history](revision-history.md), [snooze](revision-snooze.md), [authorization](../security/revision-authorization.md) and [reconciliation](../runbooks/revision-reconciliation.md).

Verification covers portable policy/ranking/timezone tests, actual PostgreSQL migration/RLS/idempotency/session/snooze tests with PGlite, browser interactions, ten viewport sizes and light/dark accessibility audits. Docker-backed Supabase/extension tests remain a CI responsibility because Docker is unavailable here.
