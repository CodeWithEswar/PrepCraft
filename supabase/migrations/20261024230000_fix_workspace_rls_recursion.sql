-- Migration: Fix Workspace RLS Recursion & Search Paths
-- Timestamp: 20261024230000

-- 1. Disable FORCE RLS on workspaces and workspace_members
-- This allows security definer functions owned by database owner to query membership without RLS recursion
alter table public.workspaces no force row level security;
alter table public.workspace_members no force row level security;

-- 2. Drop redundant and recursive policies
drop policy if exists "Workspace members can view workspace" on public.workspaces;
drop policy if exists "Users can view workspaces they are members of" on public.workspaces;

drop policy if exists "Workspace members can view members" on public.workspace_members;
drop policy if exists "Users can view members of their workspaces" on public.workspace_members;

-- 3. Update helper functions with explicit search_path
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth, pg_catalog
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

create or replace function public.is_workspace_owner(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth, pg_catalog
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = (select auth.uid())
      and role = 'owner'
      and status = 'active'
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated, service_role;

revoke all on function public.is_workspace_owner(uuid) from public;
grant execute on function public.is_workspace_owner(uuid) to authenticated, service_role;

-- 4. Re-create clean, non-recursive SELECT policies
create policy "Users can view workspaces they are members of"
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id));

create policy "Users can view their own workspace memberships"
  on public.workspace_members for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can view co-members of workspaces they belong to"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id));
