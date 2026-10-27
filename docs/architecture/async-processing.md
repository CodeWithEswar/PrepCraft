# Asynchronous processing

A committed domain transaction creates its outbox/job record before any external publication. A publisher leases jobs, sends identifiers to Queues, and acknowledges the lease. A lost publication acknowledgment can cause redelivery; stable event identity makes that safe.

Publishing and processing leases last two minutes. Queued jobs can be redispatched after fifteen minutes. Dispatch marks exhausted jobs failed after six processing attempts or twelve publication attempts. Queue retries use bounded exponential delay and a DLQ.

File deletion remains DELETING until R2 deletion succeeds and the matching lease is committed. R2 delete is idempotent. Processed event markers and business finalization are written together. A failed job can be replayed by the service-only platform_replay RPC with a bounded reason and audit.
