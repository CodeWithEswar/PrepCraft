# Security: Mock Authorization & Multi-Tenant RLS

## 1. Tenancy Model
Every table in the mock interview module is strictly isolated by both `workspace_id` and `user_id`:
- `mock_blueprints` (platform templates public; workspace custom strictly private)
- `mock_sessions`
- `mock_session_sections`
- `mock_session_items`
- `mock_session_events`
- `mock_reviews`

## 2. Row Level Security Verification
Every table has both `enable row level security` and `force row level security` active:
```sql
create policy mock_session_owner on public.mock_sessions for all to authenticated
  using (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  with check (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));
```
Guessed UUIDs or mismatched workspace slugs from other tenants fail with `404 / 403` at the database level.
