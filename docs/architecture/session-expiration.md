# Architecture: Server-Authoritative Session Expiration

## 1. Threat Model & Client Invalidation
If a client pauses execution by sleeping the operating system, closing the laptop, or tampering with local browser time, the simulation deadline must not be compromised.

## 2. Server Enforcement Strategy
1. **Timestamp Persistence**: `expires_at = started_at + total_duration_seconds` is recorded at session launch on `mock_sessions` and `execution_sessions`.
2. **Mutation Guard**: Every mutation (`save_answer`, `flag_item`, `code_run`) evaluates:
   ```sql
   if now() >= session.expires_at and session.policy_snapshot->>'autoSubmit' = 'true' then
     raise exception 'SESSION_EXPIRED';
   end if;
   ```
3. **Lazy Finalization**: When an expired session is reopened or read, it is finalized automatically if not already marked as submitted or expired.
4. **No Per-Second Cron**: Expiration does not create high-frequency cron workers. Expiry checks are transactional and evaluated on-demand.
