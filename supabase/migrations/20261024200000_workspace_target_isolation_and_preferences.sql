-- Migration: Workspace Target Isolation, Preferences, Membership, and Lifecycle System
-- Author: PrepCraft Architecture Team
-- Timestamp: 20261024200000

-- ============================================================================
-- 1. EXTEND WORKSPACES TABLE (LIFECYCLE, TIMEZONE & PROVENANCE)
-- ============================================================================
alter table public.workspaces 
  add column if not exists status text not null default 'active' check (status in ('active', 'archived')),
  add column if not exists archived_at timestamptz,
  add column if not exists timezone text not null default 'UTC',
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null;

-- Backfill created_by_user_id from created_by if present
update public.workspaces
set created_by_user_id = created_by
where created_by_user_id is null and created_by is not null;

create index if not exists idx_workspaces_status on public.workspaces(status);
create index if not exists idx_workspaces_created_by_user_id on public.workspaces(created_by_user_id);

-- ============================================================================
-- 2. ENHANCE WORKSPACE_MEMBERS (ROLES & STATUS CONSTRAINTS)
-- ============================================================================
alter table public.workspace_members
  add column if not exists joined_at timestamptz default now();

alter table public.workspace_members drop constraint if exists workspace_members_status_check;
alter table public.workspace_members add constraint workspace_members_status_check 
  check (status in ('active', 'invited', 'disabled', 'revoked'));

alter table public.workspace_members drop constraint if exists workspace_members_role_check;
alter table public.workspace_members add constraint workspace_members_role_check 
  check (role in ('owner', 'admin', 'member'));

create index if not exists idx_workspace_members_user_status on public.workspace_members(user_id, status);
create index if not exists idx_workspace_members_composite on public.workspace_members(workspace_id, user_id, status);

-- ============================================================================
-- 3. CANONICAL CATALOGS: COMPANIES & ROLES
-- ============================================================================
create table if not exists public.companies (
  id text primary key,
  name text not null,
  slug text not null unique,
  tier text not null default 'tier_1',
  category text,
  description text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_companies_is_active on public.companies(is_active);

create table if not exists public.roles (
  id text primary key,
  role_family text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_roles_role_family on public.roles(role_family, is_active);

-- Seed canonical companies
insert into public.companies (id, name, slug, tier, category, description)
values
  ('amazon', 'Amazon', 'amazon', 'tier_1', 'Big Tech / Cloud', 'Online Assessments (OA), DSA, scalable services, and Leadership Principles.'),
  ('google', 'Google', 'google', 'tier_1', 'Big Tech / Search & AI', 'Algorithmic excellence, rigorous time/space complexity analysis, and system architecture.'),
  ('microsoft', 'Microsoft', 'microsoft', 'tier_1', 'Big Tech / Enterprise', 'Data structures, algorithm optimization, and enterprise software design.'),
  ('cisco', 'Cisco', 'cisco', 'tier_1', 'Networking / Enterprise', 'Core computer networking, distributed routing protocols, and systems fundamentals.'),
  ('qualcomm', 'Qualcomm', 'qualcomm', 'tier_1', 'Semiconductors / Embedded', 'Low-level architectures, memory management, operating systems, and hardware-software integration.'),
  ('meta', 'Meta', 'meta', 'tier_1', 'Big Tech / Social', 'High-throughput algorithms, graph theory, and distributed systems scaling.'),
  ('apple', 'Apple', 'apple', 'tier_1', 'Big Tech / Consumer Hardware & OS', 'Memory safety, algorithmic performance, and robust system programming.'),
  ('netflix', 'Netflix', 'netflix', 'tier_1', 'Streaming / Microservices', 'Microservices design, resiliency patterns, and distributed telemetry.'),
  ('tcs', 'TCS', 'tcs', 'services', 'IT Services / Enterprise', 'National Qualifier Test (NQT), Digital & Prime coding patterns, and foundational CS.'),
  ('infosys', 'Infosys', 'infosys', 'services', 'IT Services / Enterprise', 'InfyTQ, DSE/SP algorithmic tracks, and core programming.')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description;

-- Seed canonical roles
insert into public.roles (id, role_family, name, description)
values
  ('software-engineer', 'Software Engineer', 'Software Engineer', 'Core algorithms, data structures, and general computer science problem solving.'),
  ('backend-engineer', 'Backend Engineer', 'Backend Engineer', 'APIs, relational & NoSQL databases, concurrency, and distributed architectures.'),
  ('frontend-engineer', 'Frontend Engineer', 'Frontend Engineer', 'Modern JavaScript/TypeScript, DOM performance, component architecture, and web systems.'),
  ('full-stack-engineer', 'Full-Stack Engineer', 'Full-Stack Engineer', 'End-to-end web architectures, client state management, and backend API integration.'),
  ('mobile-engineer', 'Mobile Engineer', 'Mobile Engineer', 'iOS and Android native architecture, performance profiling, and client offline persistence.'),
  ('data-ml-engineer', 'Data / ML Engineer', 'Data / ML Engineer', 'Data streaming, pipeline orchestration, SQL optimization, and model deployment.')
on conflict (id) do update set
  role_family = excluded.role_family,
  name = excluded.name,
  description = excluded.description;

-- ============================================================================
-- 4. ENHANCE WORKSPACE_TARGETS (TARGET ISOLATED FROM SCHEDULING)
-- ============================================================================
alter table public.workspace_targets
  add column if not exists role_id text references public.roles(id) on delete set null,
  add column if not exists custom_role_name text,
  add column if not exists preparation_level text not null default 'developing' check (preparation_level in ('foundation', 'developing', 'interview_preparation')),
  add column if not exists interview_language text not null default 'java' check (interview_language in ('java', 'python', 'cpp', 'javascript_typescript', 'other')),
  add column if not exists template_version integer not null default 1;

-- Relax target_date constraint to allow calendar dates without failing on historical inspection
alter table public.workspace_targets drop constraint if exists workspace_targets_target_date_check;
alter table public.workspace_targets add constraint workspace_targets_target_date_check
  check (target_date is null or target_date >= '2020-01-01'::date);

create index if not exists idx_workspace_targets_prep_level on public.workspace_targets(preparation_level);
create index if not exists idx_workspace_targets_language on public.workspace_targets(interview_language);

-- ============================================================================
-- 5. WORKSPACE_PREFERENCES TABLE (DEDICATED SCHEDULING MODEL)
-- ============================================================================
create table if not exists public.workspace_preferences (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  weekly_target_minutes integer not null default 600 check (weekly_target_minutes > 0 and weekly_target_minutes <= 10080),
  default_daily_minutes integer not null default 120 check (default_daily_minutes > 0 and default_daily_minutes <= 1440),
  study_days text[] not null default array['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::text[],
  planning_mode text not null default 'balanced' check (planning_mode in ('balanced', 'intense', 'flexible')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_workspace_preferences_updated_at on public.workspace_preferences;
create trigger set_workspace_preferences_updated_at
  before update on public.workspace_preferences
  for each row execute function public.handle_updated_at();

-- Migrate existing records from workspace_settings if present
insert into public.workspace_preferences (workspace_id, weekly_target_minutes, default_daily_minutes, study_days, created_at, updated_at)
select 
  workspace_id,
  weekly_target_minutes,
  default_daily_minutes,
  study_days,
  created_at,
  updated_at
from public.workspace_settings
on conflict (workspace_id) do update set
  weekly_target_minutes = excluded.weekly_target_minutes,
  default_daily_minutes = excluded.default_daily_minutes,
  study_days = excluded.study_days;

-- ============================================================================
-- 6. WORKSPACE_ACTIVITY_EVENTS TABLE (AUDIT & REACTION STREAM)
-- ============================================================================
create table if not exists public.workspace_activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'workspace.created',
    'workspace.renamed',
    'workspace.switched',
    'workspace.archived',
    'workspace.restored',
    'workspace.target_updated',
    'workspace.commitment_updated',
    'workspace.template_changed'
  )),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_activity_workspace on public.workspace_activity_events(workspace_id, created_at desc);
create index if not exists idx_workspace_activity_user on public.workspace_activity_events(user_id, created_at desc);

-- ============================================================================
-- 7. HELPER FUNCTIONS FOR AUTHORIZATION & RLS (SECURITY DEFINER)
-- ============================================================================
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
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
set search_path = ''
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

-- Grant execution to authenticated users
revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated, service_role;

revoke all on function public.is_workspace_owner(uuid) from public;
grant execute on function public.is_workspace_owner(uuid) to authenticated, service_role;

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================
alter table public.companies enable row level security;
alter table public.companies force row level security;

alter table public.roles enable row level security;
alter table public.roles force row level security;

alter table public.workspace_preferences enable row level security;
alter table public.workspace_preferences force row level security;

alter table public.workspace_activity_events enable row level security;
alter table public.workspace_activity_events force row level security;

-- Policies for companies & roles (Read-only catalog)
create policy "Allow read access to canonical companies"
  on public.companies for select
  to authenticated, anon
  using (true);

create policy "Allow read access to canonical roles"
  on public.roles for select
  to authenticated, anon
  using (true);

-- Policies for workspaces
drop policy if exists "Users can view workspaces they are members of" on public.workspaces;
create policy "Users can view workspaces they are members of"
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id));

drop policy if exists "Workspace owners can update workspaces" on public.workspaces;
create policy "Workspace owners can update workspaces"
  on public.workspaces for update
  to authenticated
  using (public.is_workspace_owner(id))
  with check (public.is_workspace_owner(id));

-- Policies for workspace_members
drop policy if exists "Users can view members of their workspaces" on public.workspace_members;
create policy "Users can view members of their workspaces"
  on public.workspace_members for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_workspace_member(workspace_id));

drop policy if exists "Workspace owners can manage members" on public.workspace_members;
create policy "Workspace owners can manage members"
  on public.workspace_members for all
  to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

-- Policies for workspace_targets
drop policy if exists "Workspace members can view targets" on public.workspace_targets;
create policy "Workspace members can view targets"
  on public.workspace_targets for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace owners and admins can update targets" on public.workspace_targets;
create policy "Workspace owners can update targets"
  on public.workspace_targets for update
  to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

-- Policies for workspace_preferences
create policy "Workspace members can view preferences"
  on public.workspace_preferences for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Workspace owners can update preferences"
  on public.workspace_preferences for update
  to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

create policy "Workspace creators can insert preferences"
  on public.workspace_preferences for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));

-- Policies for workspace_activity_events
create policy "Workspace members can view activity events"
  on public.workspace_activity_events for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can record activity events"
  on public.workspace_activity_events for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id) 
    and user_id = (select auth.uid())
  );

-- ============================================================================
-- 9. LIFECYCLE RPC PROCEDURES (ARCHIVE & RESTORE)
-- ============================================================================
create or replace function public.archive_workspace(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid;
  v_is_owner boolean;
  v_workspace_name text;
begin
  v_caller_id := (select auth.uid());
  if v_caller_id is null then
    return jsonb_build_object('success', false, 'error', 'Unauthenticated');
  end if;

  -- Verify owner permission
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = v_caller_id
      and role = 'owner'
      and status = 'active'
  ) into v_is_owner;

  if not v_is_owner then
    return jsonb_build_object('success', false, 'error', 'Permission denied: only workspace owners can archive workspaces');
  end if;

  select name into v_workspace_name from public.workspaces where id = p_workspace_id;

  update public.workspaces
  set status = 'archived',
      archived_at = now(),
      updated_at = now()
  where id = p_workspace_id;

  -- Emit activity event
  insert into public.workspace_activity_events (
    workspace_id,
    user_id,
    event_type,
    payload
  ) values (
    p_workspace_id,
    v_caller_id,
    'workspace.archived',
    jsonb_build_object('workspace_name', v_workspace_name, 'archived_at', now())
  );

  return jsonb_build_object('success', true, 'workspace_id', p_workspace_id, 'status', 'archived');
end;
$$;

create or replace function public.restore_workspace(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid;
  v_is_owner boolean;
  v_workspace_name text;
begin
  v_caller_id := (select auth.uid());
  if v_caller_id is null then
    return jsonb_build_object('success', false, 'error', 'Unauthenticated');
  end if;

  -- Verify owner permission
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = v_caller_id
      and role = 'owner'
      and status = 'active'
  ) into v_is_owner;

  if not v_is_owner then
    return jsonb_build_object('success', false, 'error', 'Permission denied: only workspace owners can restore workspaces');
  end if;

  select name into v_workspace_name from public.workspaces where id = p_workspace_id;

  update public.workspaces
  set status = 'active',
      archived_at = null,
      updated_at = now()
  where id = p_workspace_id;

  -- Emit activity event
  insert into public.workspace_activity_events (
    workspace_id,
    user_id,
    event_type,
    payload
  ) values (
    p_workspace_id,
    v_caller_id,
    'workspace.restored',
    jsonb_build_object('workspace_name', v_workspace_name, 'restored_at', now())
  );

  return jsonb_build_object('success', true, 'workspace_id', p_workspace_id, 'status', 'active');
end;
$$;

revoke all on function public.archive_workspace(uuid) from public;
grant execute on function public.archive_workspace(uuid) to authenticated, service_role;

revoke all on function public.restore_workspace(uuid) from public;
grant execute on function public.restore_workspace(uuid) to authenticated, service_role;

-- ============================================================================
-- 10. UPDATE BOOTSTRAP_INITIAL_WORKSPACE TO POPULATE PREFERENCES & ACTIVITY
-- ============================================================================
drop function if exists public.bootstrap_initial_workspace(uuid, text, text, text, text, text, text, text, text, integer, text[], integer, date, text, integer, integer, text[], jsonb, jsonb);
drop function if exists public.bootstrap_initial_workspace(uuid, text, text, text, text, text, text, text, text, integer, text[], integer, date, text, integer, integer, text[]);
drop function if exists public.bootstrap_initial_workspace cascade;

create or replace function public.bootstrap_initial_workspace(
  p_user_id uuid,
  p_display_name text,
  p_workspace_name text,
  p_role_family text,
  p_role_name text,
  p_company_id text,
  p_company_name text,
  p_custom_company_name text,
  p_preferred_coding_language text,
  p_weekly_target_minutes integer,
  p_study_days text[],
  p_default_daily_minutes integer,
  p_target_date date,
  p_template_id text,
  p_total_weekly_minutes integer default null,
  p_planned_sessions integer default null,
  p_focus_areas text[] default null,
  p_first_week_plan jsonb default null,
  p_starter_items jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace_id uuid;
  v_slug_base text;
  v_unique_slug text;
  v_counter integer := 1;
  v_existing_workspace_id uuid;
  v_existing_slug text;
begin
  -- Idempotency check
  select w.id, w.slug into v_existing_workspace_id, v_existing_slug
  from public.workspaces w
  inner join public.workspace_members wm on wm.workspace_id = w.id
  where wm.user_id = p_user_id and wm.role = 'owner'
  limit 1;

  if v_existing_workspace_id is not null then
    return jsonb_build_object(
      'workspace_id', v_existing_workspace_id,
      'workspace_slug', v_existing_slug,
      'idempotent', true
    );
  end if;

  -- Generate clean slug
  v_slug_base := lower(regexp_replace(trim(p_workspace_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug_base := trim(both '-' from v_slug_base);
  if v_slug_base = '' or v_slug_base is null then
    v_slug_base := 'prep-workspace';
  end if;

  v_unique_slug := v_slug_base;
  while exists (select 1 from public.workspaces where slug = v_unique_slug) loop
    v_counter := v_counter + 1;
    v_unique_slug := v_slug_base || '-' || v_counter::text;
  end loop;

  -- 1. Create workspace entity
  insert into public.workspaces (
    name,
    slug,
    created_by,
    created_by_user_id,
    status,
    timezone
  )
  values (
    p_workspace_name,
    v_unique_slug,
    p_user_id,
    p_user_id,
    'active',
    'UTC'
  )
  returning id into v_workspace_id;

  -- 2. Add owner membership
  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    status,
    joined_at
  )
  values (
    v_workspace_id,
    p_user_id,
    'owner',
    'active',
    now()
  );

  -- 3. Insert workspace target (separated from scheduling)
  insert into public.workspace_targets (
    workspace_id,
    role_family,
    role_name,
    company_id,
    company_name,
    custom_company_name,
    target_date,
    preparation_level,
    interview_language,
    template_id,
    template_version
  )
  values (
    v_workspace_id,
    p_role_family::text,
    p_role_name,
    p_company_id,
    p_company_name,
    p_custom_company_name,
    p_target_date,
    'developing',
    coalesce(p_preferred_coding_language, 'java'),
    p_template_id,
    1
  );

  -- 4. Insert workspace preferences (scheduling model)
  insert into public.workspace_preferences (
    workspace_id,
    weekly_target_minutes,
    default_daily_minutes,
    study_days,
    planning_mode
  )
  values (
    v_workspace_id,
    coalesce(p_weekly_target_minutes, 600),
    coalesce(p_default_daily_minutes, 120),
    coalesce(p_study_days, array['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::text[]),
    'balanced'
  );

  -- 5. Insert workspace settings for legacy backward compatibility
  insert into public.workspace_settings (
    workspace_id,
    weekly_target_minutes,
    study_days,
    default_daily_minutes,
    preferred_coding_language
  )
  values (
    v_workspace_id,
    coalesce(p_weekly_target_minutes, 600),
    coalesce(p_study_days, array['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::text[]),
    coalesce(p_default_daily_minutes, 120),
    p_preferred_coding_language
  );

  -- 6. Insert initial starter plan
  insert into public.workspace_plans (
    workspace_id,
    template_id,
    total_weekly_minutes,
    planned_sessions,
    focus_areas,
    first_week_plan,
    starter_items,
    status
  )
  values (
    v_workspace_id,
    p_template_id,
    coalesce(p_total_weekly_minutes, p_weekly_target_minutes, 600),
    coalesce(p_planned_sessions, 5),
    coalesce(p_focus_areas, array[]::text[]),
    coalesce(p_first_week_plan, '[]'::jsonb),
    coalesce(p_starter_items, '[]'::jsonb),
    'ready'
  );

  -- 7. Update profile
  update public.profiles
  set last_active_workspace_id = v_workspace_id,
      preferred_coding_language = coalesce(p_preferred_coding_language, preferred_coding_language),
      onboarding_state = 'completed',
      onboarding_completed_at = now(),
      updated_at = now()
  where id = p_user_id;

  -- 8. Emit activity event
  insert into public.workspace_activity_events (
    workspace_id,
    user_id,
    event_type,
    payload
  ) values (
    v_workspace_id,
    p_user_id,
    'workspace.created',
    jsonb_build_object('name', p_workspace_name, 'slug', v_unique_slug)
  );

  -- 9. Clean up temporary draft
  delete from public.onboarding_drafts where user_id = p_user_id;

  return jsonb_build_object(
    'workspace_id', v_workspace_id,
    'workspace_slug', v_unique_slug,
    'idempotent', false
  );
end;
$$;

revoke all on function public.bootstrap_initial_workspace from public;
grant execute on function public.bootstrap_initial_workspace to authenticated, service_role;

