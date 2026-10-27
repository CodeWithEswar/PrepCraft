# 0023: Attempt evidence and downstream events commit atomically

Status: Accepted

Final debrief and a unique `attempt.completed` outbox event commit in one PostgreSQL transaction. Revision, Mastery and Mistake Journal remain separate consumers; none currently exists, so events remain pending and the UI never claims revision was scheduled. The outbox has stable event IDs and consumer idempotency contracts. No Cloudflare Queue is provisioned for an absent consumer.

Private code/scratchpad/reflection are not copied into analytics events. A follow-up opens a prefilled Planning task for explicit confirmation through Planning's existing action contract. Execution invalidates workspace-scoped Today/Planning caches and returns to Today for the next recommendation rather than copying its ranking algorithm.
