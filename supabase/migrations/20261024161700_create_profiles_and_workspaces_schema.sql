-- Migration: Create Profiles, Workspaces, and Workspace Members Schema
-- Author: PrepCraft Architecture Team
-- Timestamp: 20261024161700

-- 1. Helper function for updating updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Create public.profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  graduation_year smallint check (graduation_year is null or (graduation_year >= 1980 and graduation_year <= 2100)),
  college_name text,
  preferred_coding_language text check (preferred_coding_language is null or preferred_coding_language in ('java', 'python', 'cpp', 'javascript', 'other')),
  timezone text not null default 'UTC',
  onboarding_state text not null default 'not_started' check (onboarding_state in ('not_started', 'profile', 'career_target', 'coding_language', 'study_commitment', 'target_date', 'workspace', 'completed')),
  onboarding_completed_at timestamptz,
  last_active_workspace_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for profile lookups and timezone
create index if not exists idx_profiles_onboarding_state on public.profiles(onboarding_state);
create index if not exists idx_profiles_last_active_workspace on public.profiles(last_active_workspace_id);

-- 3. Create public.workspaces table
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  target_role text,
  target_company text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workspaces_slug on public.workspaces(slug);
create index if not exists idx_workspaces_created_by on public.workspaces(created_by);

-- Link profile last_active_workspace_id foreign key now that workspaces exists
alter table public.profiles
  drop constraint if exists fk_profiles_last_active_workspace,
  add constraint fk_profiles_last_active_workspace
  foreign key (last_active_workspace_id)
  references public.workspaces(id)
  on delete set null;

-- 4. Create public.workspace_members table
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('active', 'invited', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists idx_workspace_members_user_id on public.workspace_members(user_id);
create index if not exists idx_workspace_members_workspace_status on public.workspace_members(workspace_id, status);

-- 5. Attach updated_at triggers
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.handle_updated_at();

drop trigger if exists set_workspace_members_updated_at on public.workspace_members;
create trigger set_workspace_members_updated_at
  before update on public.workspace_members
  for each row execute function public.handle_updated_at();

-- 6. Enable and Force Row Level Security
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

alter table public.workspaces enable row level security;
alter table public.workspaces force row level security;

alter table public.workspace_members enable row level security;
alter table public.workspace_members force row level security;

-- 7. RLS Policies for Profiles
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using ( (select auth.uid()) = id );

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check ( (select auth.uid()) = id );

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- 8. RLS Policies for Workspaces
create policy "Workspace members can view workspace"
  on public.workspaces
  for select
  to authenticated
  using (
    id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = (select auth.uid())
        and wm.status = 'active'
    )
  );

create policy "Authenticated users can create workspace"
  on public.workspaces
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
  );

create policy "Workspace owners and admins can update workspace"
  on public.workspaces
  for update
  to authenticated
  using (
    id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = (select auth.uid())
        and wm.role in ('owner', 'admin')
        and wm.status = 'active'
    )
  )
  with check (
    id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = (select auth.uid())
        and wm.role in ('owner', 'admin')
        and wm.status = 'active'
    )
  );

-- 9. RLS Policies for Workspace Members
create policy "Workspace members can view members"
  on public.workspace_members
  for select
  to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = (select auth.uid())
        and wm.status = 'active'
    )
  );

create policy "Users can self-enroll as workspace owner upon creation"
  on public.workspace_members
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
  );

create policy "Workspace owners and admins can update member status"
  on public.workspace_members
  for update
  to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = (select auth.uid())
        and wm.role in ('owner', 'admin')
        and wm.status = 'active'
    )
  )
  with check (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = (select auth.uid())
        and wm.role in ('owner', 'admin')
        and wm.status = 'active'
    )
  );

-- 10. Automatic Profile Bootstrap Trigger on auth.users (idempotent fallback)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, timezone, onboarding_state)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'UTC',
    'not_started'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Revoke default public execution, grant only to supabase auth admin
revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
