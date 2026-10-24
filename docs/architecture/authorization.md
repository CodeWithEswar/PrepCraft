# Architecture — Authorization & Workspace Isolation

## 1. Purpose & Threat Model

Enforces multi-layered access control ensuring candidates can only read, write, or mutate data within workspaces where they hold verified, active membership.
The client application is never trusted as a security boundary.

---

## 2. Five-Layer Defense-in-Depth Model

PrepCraft implements five progressive authorization and constraint boundaries:

```text
Layer 1: Client Capability Hints
         Components conditionally render controls and navigation based on user capabilities.
         (Client is never the authoritative boundary).
                 ↓
Layer 2: Server Action & Route Authorization
         Server entry points (`server/permissions.ts`) verify active session identity
         and assert workspace membership before processing operations.
                 ↓
Layer 3: Domain Service Business Invariants
         Domain services (`services/`) assert operational constraints
         (e.g. valid stage progression, attempt completion state, ownership integrity).
                 ↓
Layer 4: PostgreSQL Schema Constraints & Triggers
         Database engine enforces NOT NULL, CHECK, UNIQUE, and FOREIGN KEY constraints
         to guarantee referential integrity and valid states.
                 ↓
Layer 5: Supabase PostgreSQL Row Level Security (RLS)
         The authoritative database engine evaluates SQL policies on every query.
         Unauthorized rows are filtered out or rejected at the engine level.
```

---

## 3. Workspace Resolution Contract

Route parameters (such as `/w/[workspaceSlug]/...` or mutation payloads containing `workspaceId`) are never trusted blindly:

```text
1. Extract workspaceSlug from route params or workspaceId from mutation payload.
2. Authenticate the caller session using Supabase Auth (resolve auth.uid()).
3. Query active membership in `workspace_members` linking auth.uid() to workspace_id.
4. If membership is missing or disabled:
   - Route requests: Redirect to onboarding or return HTTP 403 Forbidden without leaking workspace metadata.
   - Server Actions: Reject immediately with an AuthorizationError.
5. Execute scoped queries and mutations using the verified workspace context.
```

---

## 4. Row Level Security (RLS) Invariant

Every table in the `public` schema has Row Level Security enabled and forced:

```sql
alter table public.<table> enable row level security;
alter table public.<table> force row level security;

create policy "Workspace member isolation" on public.<table>
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );
```

No regular client query or Server Action can bypass RLS. Service-role credentials are strictly restricted to administrative migrations and background maintenance.
