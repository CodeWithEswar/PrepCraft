# Cloudflare notification pipeline

The dedicated prepcraft-notifications Worker is configured in cloudflare/wrangler/notifications.jsonc. Its minute Cron wakes a bounded Supabase dispatcher and outbox publisher. Existing unrelated account queues are untouched. Delivery and report queues have separate concurrency limits and dedicated dead-letter queues; no D1 binding exists.

Queue envelopes reuse the shared strict version-one contract. Bodies contain only job UUID, kind, workspace/user IDs, occurrence time, correlation ID and idempotency key. Private reminder text, email addresses and push credentials are loaded from the guarded service RPC only after a delivery lease is acquired.

Publishing uses batches of five. Delivery consumes at most five messages, report generation two, with bounded concurrency and five queue retries. Known transient provider failures use exponential backoff. Supabase delivery leases have two-minute expiry and at most six attempts. Resend retries stop before its twenty-four-hour idempotency window (23-hour local limit). Push acceptance ambiguity terminates instead of claiming exactly-once sending.

The only public HTTP endpoints are minimal /health and signature-verified /webhooks/resend. There is no public dispatcher or credential inspection endpoint. Logs contain fixed event names, safe status enums, counts and correlation IDs, never raw provider responses or account text.

Cloudflare Cron/Queues official documentation and Resend idempotency documentation were checked during implementation. Workers use fetch + WebCrypto, not Node or Next runtime imports.
