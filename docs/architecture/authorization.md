# Architecture — Authorization & Workspace Isolation

## Purpose
Enforces multi-layer access control ensuring candidates can only read, write, or mutate data within workspaces they legitimately belong to.

## Defense-in-Depth Model
PrepCraft implements four progressive enforcement layers:

```text
Layer 1: UI Capability Rendering
         Components conditionally render controls based on permissions.
                 ↓
Layer 2: Server Action / Route Authorization
         Server entry points verify active session and workspace membership.
                 ↓
Layer 3: Domain Service Authorization
         Business services assert invariants (e.g. attempt ownership, revision validity).
                 ↓
Layer 4: Supabase PostgreSQL Row Level Security (RLS)
         The authoritative database engine denies unauthorized queries at the SQL level.
```

## Workspace Resolution
Route parameters such as `/w/[workspaceSlug]/...` are never trusted blindly:

```text
1. Extract workspaceSlug from route params
2. Resolve workspace ID where slug = workspaceSlug
3. Assert active authenticated user is a verified member of workspace
4. Query data using scoped workspace ID
```

If membership validation fails, the server responds with a 403 Forbidden or redirects to onboarding without revealing internal workspace metadata.

## Database RLS Invariant
Every tenant table (`workspace_questions`, `attempts`, `revisions`, `daily_plans`, `interviews`, `applications`) enforces:
```sql
alter table <table> enable row level security;
create policy "Workspace member isolation" on <table>
  for all using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );
```
No table query can bypass RLS without explicitly using the restricted server-side service-role client.
