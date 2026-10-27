# Transactional notification outbox

An external delivery or pending report writes its outbox row in the same database transaction as the logical event. The uniqueness key is tied to the delivery/report UUID. No provider call runs inside a user transaction.

A service-only claim locks at most twenty-five due rows with SKIP LOCKED and gives each an unguessable lease. The publisher sends the versioned envelope, then acknowledges with the matching lease. A crash between send and acknowledgment may publish twice; consumer-side delivery/report idempotency makes replay safe. Expired publisher leases are reclaimable. Twelve exhausted publication attempts become an explicit failed outbox record.

A consumer acknowledges only after terminal delivery state is committed, a report is frozen, or a future wake-up is durably written. Quiet-hour and snooze waits reset the same unique outbox row to pending with a future time. No unbounded queue messages, account bodies, or database truth are mirrored to Cloudflare.

Exactly-once occurrence creation is enforced by unique keys. External networks remain at-least-once/ambiguous systems; stable provider keys, leases, per-device acknowledgments and browser deduplication reduce duplicates without overstating delivery guarantees.
