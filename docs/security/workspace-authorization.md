# Security: Workspace Authorization & RLS Architecture

## 1. Threat Model & Principles
1. **Workspace ID in a request is NEVER proof of authorization.**
   A client submitting a valid UUID for a workspace cannot read, modify, archive, or restore workspace data unless server verification and PostgreSQL RLS confirm an active membership for the authenticated user.
2. **Slugs are navigation identifiers, not secrets.**
   Slugs like `/w/amazon-sde-i` are public routing strings. Workspace data is shielded by row-level security and server-side verification.
3. **Disabled / Revoked members lose access immediately.**
   If a user membership is marked `disabled`, `invited`, or `revoked`, both server guards and PostgreSQL RLS deny all access.
4. **Service role keys never reach the browser.**
   All user-facing operations execute in authenticated user context (`auth.uid()`).

## 2. Server Authorization (`verifyWorkspaceAccess`)
Executed before executing mutations or rendering private layouts:
```ts
export async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string,
  requiredRole: "member" | "owner" = "member"
): Promise<VerifiedMembershipResult>
```
- Queries `workspace_members` with `workspace_id = p_workspace_id AND user_id = auth.uid() AND status = 'active'`.
- Validates that `owner`-only lifecycle actions (archive, restore, delete, target reconfiguration) are strictly restricted to members with `role = 'owner'` or `'admin'`.

## 3. PostgreSQL Security Definer & RLS Policies
PostgreSQL policies use cached subqueries for maximum performance and security:
- `public.is_workspace_member(p_workspace_id uuid)`:
  ```sql
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = (SELECT auth.uid())
      AND status = 'active'
  );
  ```
- `public.is_workspace_owner(p_workspace_id uuid)`:
  ```sql
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
  ```

Row-Level Security is strictly enabled on:
- `public.workspaces`
- `public.workspace_members`
- `public.workspace_targets`
- `public.workspace_preferences`
- `public.workspace_activity_events`
- `public.companies` (authenticated read)
- `public.roles` (authenticated read)

## 4. Cross-Workspace Protection Matrix
| Entity / Action | Active Owner | Active Member | Disabled Member | Unrelated User |
| :--- | :--- | :--- | :--- | :--- |
| Read Workspace Target | Allow | Allow | Deny | Deny |
| Update Workspace Target | Allow | Deny | Deny | Deny |
| Update Preferences | Allow | Deny | Deny | Deny |
| Archive Workspace | Allow | Deny | Deny | Deny |
| Restore Workspace | Allow | Deny | Deny | Deny |
| Read Activity Events | Allow | Allow | Deny | Deny |
