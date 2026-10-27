# Runbook: Session Reconciliation

## 1. Problem
A session whose `expires_at < now()` remains marked as `active` because the user closed their laptop without submitting.

## 2. Automatic Handling
Upon the next read or mutation query referencing the session, the server evaluates `server_now >= expires_at` and triggers lazy finalization.

## 3. Scheduled Reconciliation
A background reconciliation job runs periodically to reconcile dangling active sessions:
```sql
update public.mock_sessions
set status = 'expired',
    completed_at = expires_at,
    updated_at = now()
where status = 'active'
  and expires_at is not null
  and expires_at < now() - interval '5 minutes';
```
This ensures analytics and readiness calculations remain accurate even if the user never reopens the tab.
