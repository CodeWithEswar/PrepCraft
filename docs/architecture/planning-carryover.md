# Explicit carryover

Earlier unfinished work appears in the carryover queue without being silently injected into a new day. The user chooses a destination or explicitly cancels the projection. Moving flexible current/future work changes the schedule; carrying earlier work defers its old projection and creates a separate destination projection in one transaction.

`carryover_from_task_id` is a tenant-safe composite foreign key. The new projection preserves source type/ID, due date, topic/track intent, count/unit, generation identity, estimate and required status. `carryover_count` increments for true earlier-day carryover. Source-domain completion is never changed. Today rescheduling preserves the same lineage fields.

Repeated carryover is called out in the task and narrative. It is not solved with increasingly aggressive automatic scheduling. Capacity, rest, active membership, source week closure, destination week closure and optimistic versions are checked at the transaction boundary. Closed history cannot be used as a mutable source. Active work is protected from automatic rebalance; a deliberate carryover decision can retain its source without claiming completion.
