# Architecture: Workspace Isolation Boundary

## 1. Domain Boundary Principle
The workspace is the primary security, data, and presentation boundary in PrepCraft.

No workspace-owned entity may be accessed, queried, or mutated without verified workspace membership.

```text
Browser Navigation (/w/[slug]/today)
        ↓
Server Component Layout
        ↓
Authentication Check (requireUser)
        ↓
Workspace Resolution (resolveWorkspace by slug)
        ↓
Membership Verification (user_id + workspace_id + status = 'active')
        ↓
Permission Resolution (resolveWorkspacePermissions)
        ↓
PostgreSQL Row-Level Security (RLS: is_workspace_member, is_workspace_owner)
        ↓
Authoritative Workspace Domain
```

## 2. Server-First Authorization & Route Resolution
The URL `/w/[slug]/today` is navigation, not authorization:
- `resolveWorkspace(slug)` resolves the slug into a verified, strongly-typed `WorkspaceContext`.
- If the user is unauthenticated, they are redirected to login with a safe return path.
- If the user is authenticated but not an active member, a restrained access restricted UI is rendered without exposing private metadata (no target, no member count, no company details).

## 3. Defense-in-Depth: Application Layer + PostgreSQL RLS
Server authorization guards layouts and server actions.
PostgreSQL RLS guarantees data isolation at the storage layer:
- `is_workspace_member(workspace_id)`: Verifies active membership for authenticated UID.
- `is_workspace_owner(workspace_id)`: Verifies owner role with active membership.
- Policies on `workspaces`, `workspace_members`, `workspace_targets`, `workspace_preferences`, and `workspace_activity_events` enforce isolation regardless of whether queries originate from server components or direct clients.

## 4. TanStack Query Cache Isolation
To prevent cross-workspace data flash:
- All workspace-owned query keys must include `workspaceId`:
  ```ts
  workspaceQueryKeys.detail(workspaceId)      // ["workspaces", workspaceId, "detail"]
  workspaceQueryKeys.target(workspaceId)      // ["workspaces", workspaceId, "target"]
  workspaceQueryKeys.preferences(workspaceId) // ["workspaces", workspaceId, "preferences"]
  workspaceQueryKeys.plan(workspaceId)        // ["workspaces", workspaceId, "plan"]
  ```
- When switching workspaces, queries belonging to the previous workspace are actively cancelled and cleared.
