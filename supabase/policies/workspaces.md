# RLS Policies — Workspaces & Members

## Tables Covered
- `public.workspaces`
- `public.workspace_members`
- `public.profiles`

## Invariants
1. **Profile Access**: Authenticated users can read and update only their own profile (`id = auth.uid()`).
2. **Workspace Creation**: Any authenticated user may insert a workspace. Insertion automatically triggers workspace membership as Owner.
3. **Workspace Isolation**: A candidate can select and view workspace records only if an active row exists in `workspace_members` linking their `user_id` to `workspace_id`.
4. **Member Mutations**: Only workspace owners can add or remove members or modify workspace settings.

## Example SQL Policy Reference
```sql
-- Read access for workspace members
create policy "Workspace members can view workspace"
  on public.workspaces
  for select
  using (
    id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );
```
