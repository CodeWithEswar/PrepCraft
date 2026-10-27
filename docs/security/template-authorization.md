# Security: Template & Curriculum Authorization and RLS

## Overview
PrepCraft distinguishes two critical permission boundaries:
1. **Consuming Templates**: Available to all authenticated candidates preparing for interviews.
2. **Authoring & Publishing Templates**: Reserved for platform administration and internal curriculum curators. Workspace ownership **never** confers platform-wide template authoring privileges.

## Row-Level Security (RLS) Policies

### 1. Canonical Catalog (`tracks`, `topics`, `patterns`)
- `select`: Readable by any authenticated user (`auth.uid() is not null`).
- `insert / update / delete`: Restricted to service-role or platform admins.

### 2. Preparation Templates (`preparation_templates`)
- `select`: Readable if `status = 'published'` and `visibility in ('public', 'internal')`.
- Draft, review, or private templates are hidden from ordinary user sessions.

### 3. Template Versions & Curriculum Associations
- `select`: Allowed if parent version is `status = 'published'` or via platform admin privilege.

### 4. Workspace Curriculum & Overrides (`workspace_curricula`, `workspace_curriculum_overrides`)
- `select / insert / update`: Restricted strictly to active members of the workspace:
  ```sql
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_curricula.workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
  )
  ```
- Cross-workspace isolation is strictly enforced at the database layer.

## Transaction Security
- `apply_template_to_workspace` is a PostgreSQL `security definer` function with explicit search path (`search_path = public`).
- It independently verifies active membership and ownership before executing any modification.
