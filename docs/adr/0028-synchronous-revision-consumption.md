# 0028 — Schedule Revision synchronously until queues are justified

Status: Accepted. Date: 2026-10-25.

Consume committed Execution evidence transactionally in PostgreSQL with unique source receipts and locks. Keep the outbox for other domains and bounded reconciliation. Do not deploy Cloudflare for ordinary queries and snoozes. Future queues require measured scale and the same idempotency/privacy guarantees.
