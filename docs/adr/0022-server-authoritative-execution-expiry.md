# 0022: Countdown expiry locks working state on the server

Status: Accepted

Interview and OA expiry use a persisted deadline. Resolving or mutating an expired session finalizes at the deadline, closes time intervals and freezes working state before returning evidence. Late code, answer, flag, hint and phase mutations are rejected without rolling back expiry. Duplicate finish/expiry requests return the existing terminal state. Practice targets remain advisory.

No per-second worker or cron is required. An untouched expired session is materialized at its next authorized resolution; all reads and mutations interpret its deadline as expired immediately, and focus projections cap open intervals at that deadline. A sleeping or closed browser cannot extend the session.
