-- Migration: Create Onboarding Drafts, Preparation Templates, Workspace Settings, Targets, and Starter Plans
-- Author: PrepCraft Architecture Team
-- Timestamp: 20261024183000

-- 1. Extend public.profiles onboarding_state constraint to support canonical onboarding steps
alter table public.profiles drop constraint if exists profiles_onboarding_state_check;
alter table public.profiles add constraint profiles_onboarding_state_check
  check (onboarding_state in (
    'not_started',
    'welcome',
    'profile',
    'target',
    'career_target',
    'language',
    'coding_language',
    'commitment',
    'study_commitment',
    'target_date',
    'workspace',
    'ready',
    'completed'
  ));

-- 2. Create public.onboarding_drafts table for server-authoritative resumable onboarding
create table if not exists public.onboarding_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_role_family text,
  target_role_name text,
  target_company_id text,
  target_company_name text,
  custom_company_name text,
  preferred_coding_language text check (preferred_coding_language is null or preferred_coding_language in ('java', 'python', 'cpp', 'javascript', 'other')),
  weekly_target_minutes integer check (weekly_target_minutes is null or (weekly_target_minutes >= 60 and weekly_target_minutes <= 6000)),
  study_days text[] default array['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::text[],
  default_daily_minutes integer check (default_daily_minutes is null or (default_daily_minutes >= 15 and default_daily_minutes <= 1440)),
  has_target_date boolean not null default false,
  target_date date check (target_date is null or target_date >= current_date),
  workspace_name text,
  selected_template_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for onboarding_drafts updated_at
drop trigger if exists set_onboarding_drafts_updated_at on public.onboarding_drafts;
create trigger set_onboarding_drafts_updated_at
  before update on public.onboarding_drafts
  for each row execute function public.handle_updated_at();

-- 3. Create public.preparation_templates catalog
create table if not exists public.preparation_templates (
  id text primary key,
  name text not null,
  role_family text not null,
  target_company text,
  description text not null,
  tracks jsonb not null default '[]'::jsonb,
  focus_areas text[] not null default array[]::text[],
  version integer not null default 1,
  status text not null default 'active' check (status in ('active', 'archived', 'draft')),
  last_reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prep_templates_status_role on public.preparation_templates(status, role_family);

-- Trigger for preparation_templates updated_at
drop trigger if exists set_preparation_templates_updated_at on public.preparation_templates;
create trigger set_preparation_templates_updated_at
  before update on public.preparation_templates
  for each row execute function public.handle_updated_at();

-- 4. Create public.workspace_settings table
create table if not exists public.workspace_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade unique,
  weekly_target_minutes integer not null check (weekly_target_minutes > 0),
  study_days text[] not null default array['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::text[],
  default_daily_minutes integer not null check (default_daily_minutes > 0),
  preferred_coding_language text check (preferred_coding_language is null or preferred_coding_language in ('java', 'python', 'cpp', 'javascript', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workspace_settings_workspace on public.workspace_settings(workspace_id);

drop trigger if exists set_workspace_settings_updated_at on public.workspace_settings;
create trigger set_workspace_settings_updated_at
  before update on public.workspace_settings
  for each row execute function public.handle_updated_at();

-- 5. Create public.workspace_targets table
create table if not exists public.workspace_targets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade unique,
  role_family text not null,
  role_name text not null,
  company_id text,
  company_name text,
  custom_company_name text,
  target_date date check (target_date is null or target_date >= current_date),
  template_id text references public.preparation_templates(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workspace_targets_workspace on public.workspace_targets(workspace_id);
create index if not exists idx_workspace_targets_template on public.workspace_targets(template_id);

drop trigger if exists set_workspace_targets_updated_at on public.workspace_targets;
create trigger set_workspace_targets_updated_at
  before update on public.workspace_targets
  for each row execute function public.handle_updated_at();

-- 6. Create public.workspace_plans table
create table if not exists public.workspace_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade unique,
  template_id text references public.preparation_templates(id) on delete set null,
  total_weekly_minutes integer not null check (total_weekly_minutes > 0),
  planned_sessions integer not null check (planned_sessions > 0),
  focus_areas text[] not null default array[]::text[],
  first_week_plan jsonb not null default '[]'::jsonb,
  starter_items jsonb not null default '[]'::jsonb,
  status text not null default 'ready' check (status in ('generating', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workspace_plans_workspace on public.workspace_plans(workspace_id);

drop trigger if exists set_workspace_plans_updated_at on public.workspace_plans;
create trigger set_workspace_plans_updated_at
  before update on public.workspace_plans
  for each row execute function public.handle_updated_at();

-- 7. Enable and Force Row Level Security on all newly created tables
alter table public.onboarding_drafts enable row level security;
alter table public.onboarding_drafts force row level security;

alter table public.preparation_templates enable row level security;
alter table public.preparation_templates force row level security;

alter table public.workspace_settings enable row level security;
alter table public.workspace_settings force row level security;

alter table public.workspace_targets enable row level security;
alter table public.workspace_targets force row level security;

alter table public.workspace_plans enable row level security;
alter table public.workspace_plans force row level security;

-- 8. RLS Policies for onboarding_drafts
create policy "Users can view own onboarding draft"
  on public.onboarding_drafts
  for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can insert own onboarding draft"
  on public.onboarding_drafts
  for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can update own onboarding draft"
  on public.onboarding_drafts
  for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "Users can delete own onboarding draft"
  on public.onboarding_drafts
  for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- 9. RLS Policies for preparation_templates
create policy "Authenticated users can view active preparation templates"
  on public.preparation_templates
  for select
  to authenticated
  using ( status = 'active' );

-- 10. RLS Policies for workspace_settings
create policy "Workspace members can view settings"
  on public.workspace_settings
  for select
  to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = (select auth.uid())
        and wm.status = 'active'
    )
  );

create policy "Workspace owners and admins can update settings"
  on public.workspace_settings
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

create policy "Workspace creators can insert settings"
  on public.workspace_settings
  for insert
  to authenticated
  with check (
    workspace_id in (
      select w.id from public.workspaces w
      where w.created_by = (select auth.uid())
    )
  );

-- 11. RLS Policies for workspace_targets
create policy "Workspace members can view targets"
  on public.workspace_targets
  for select
  to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = (select auth.uid())
        and wm.status = 'active'
    )
  );

create policy "Workspace owners and admins can update targets"
  on public.workspace_targets
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

create policy "Workspace creators can insert targets"
  on public.workspace_targets
  for insert
  to authenticated
  with check (
    workspace_id in (
      select w.id from public.workspaces w
      where w.created_by = (select auth.uid())
    )
  );

-- 12. RLS Policies for workspace_plans
create policy "Workspace members can view workspace plans"
  on public.workspace_plans
  for select
  to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = (select auth.uid())
        and wm.status = 'active'
    )
  );

create policy "Workspace owners and admins can update workspace plans"
  on public.workspace_plans
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

create policy "Workspace creators can insert workspace plans"
  on public.workspace_plans
  for insert
  to authenticated
  with check (
    workspace_id in (
      select w.id from public.workspaces w
      where w.created_by = (select auth.uid())
    )
  );

-- 13. Seed canonical preparation templates
insert into public.preparation_templates (id, name, role_family, target_company, description, focus_areas, tracks, status)
values
  (
    'amazon-sde',
    'Amazon SDE',
    'Software Engineer',
    'Amazon',
    'Curated curriculum targeting Amazon Online Assessment (OA), Data Structures, Core CS trade-offs, and Leadership Principles.',
    array['DSA', 'Java', 'CS Fundamentals', 'System Design', 'Leadership Principles'],
    '[
      {"name": "DSA Foundations", "minutes": 240, "description": "Arrays, Strings, Hash Maps & Two Pointers"},
      {"name": "Java & Collections", "minutes": 120, "description": "OOP, memory models, and standard collections performance"},
      {"name": "Core CS Fundamentals", "minutes": 120, "description": "OS, concurrency basics, and database indexing"},
      {"name": "Leadership Principles", "minutes": 60, "description": "Customer Obsession & Ownership STAR story formulation"},
      {"name": "Deliberate Revision", "minutes": 60, "description": "Interval spaced repetition of past mistakes"}
    ]'::jsonb,
    'active'
  ),
  (
    'general-swe',
    'General Software Engineer',
    'Software Engineer',
    null,
    'Comprehensive multi-round curriculum covering patterns, algorithms, system concepts, and behavioral competencies.',
    array['Data Structures', 'Algorithms', 'Core CS', 'Problem Solving', 'Behavioral'],
    '[
      {"name": "Data Structures & Patterns", "minutes": 240, "description": "Sliding window, trees, graphs, and dynamic programming"},
      {"name": "Algorithms & Complexity", "minutes": 180, "description": "Sorting, searching, and recursion analysis"},
      {"name": "System Concepts", "minutes": 90, "description": "Networking, caches, and database transactions"},
      {"name": "Behavioral Competencies", "minutes": 60, "description": "Communication, conflict resolution, and trade-offs"},
      {"name": "Practice & Revision", "minutes": 30, "description": "Weekly consolidation of deliberate practice"}
    ]'::jsonb,
    'active'
  ),
  (
    'frontend-engineer',
    'Frontend Engineer',
    'Frontend Engineer',
    null,
    'Deep focus on modern JavaScript, browser internals, component architecture, CSS layout, and accessibility.',
    array['JavaScript/TypeScript', 'React & DOM', 'CSS & Layout', 'Frontend Architecture', 'Behavioral'],
    '[
      {"name": "JS Engine & Async Runtime", "minutes": 210, "description": "Event loop, microtasks, closures, and promises"},
      {"name": "React Performance & Hooks", "minutes": 210, "description": "State management, re-renders, and component boundaries"},
      {"name": "CSS, Grid & Responsive Design", "minutes": 90, "description": "Subgrid, animations, and container queries"},
      {"name": "Accessibility & Core Web Vitals", "minutes": 60, "description": "ARIA roles, keyboard trap prevention, and LCP/INP"},
      {"name": "Behavioral & Project Defense", "minutes": 30, "description": "Technical trade-offs and team collaboration"}
    ]'::jsonb,
    'active'
  ),
  (
    'backend-engineer',
    'Backend Engineer',
    'Backend Engineer',
    null,
    'Focused on reliable distributed systems, database query design, concurrency, API contracts, and high availability.',
    array['APIs & Concurrency', 'Databases & SQL', 'Distributed Systems', 'DSA', 'Behavioral'],
    '[
      {"name": "Relational Data Modeling & Indexing", "minutes": 240, "description": "Postgres EXPLAIN, locks, isolation levels, and migration design"},
      {"name": "API Design & Asynchronous Queues", "minutes": 180, "description": "Idempotency keys, message brokers, and retry semantics"},
      {"name": "Concurrency & Distributed State", "minutes": 120, "description": "Raft, consensus, caches, and rate limiting"},
      {"name": "Algorithmic Problem Solving", "minutes": 120, "description": "Graphs, search, and memory-constrained processing"},
      {"name": "Behavioral & Incident Reviews", "minutes": 60, "description": "Post-mortems and architecture decision records"}
    ]'::jsonb,
    'active'
  ),
  (
    'fullstack-engineer',
    'Full-Stack Engineer',
    'Full-Stack Engineer',
    null,
    'Balanced end-to-end preparation connecting client state, server boundaries, databases, and deployment pipelines.',
    array['Frontend & State', 'Backend APIs', 'Database Design', 'End-to-End Projects', 'Behavioral'],
    '[
      {"name": "End-to-End System Architecture", "minutes": 240, "description": "Edge routing, Server Components, and API boundaries"},
      {"name": "Database Schema & Optimization", "minutes": 180, "description": "Normalization, indexing, and transactional integrity"},
      {"name": "Interactive UI & State Synchronization", "minutes": 120, "description": "Optimistic updates, websockets, and caching"},
      {"name": "Core Coding & Algorithms", "minutes": 120, "description": "Practical problem solving and data structures"},
      {"name": "Behavioral & Product Thinking", "minutes": 60, "description": "User impact, product metrics, and engineering trade-offs"}
    ]'::jsonb,
    'active'
  )
on conflict (id) do update set
  name = excluded.name,
  role_family = excluded.role_family,
  target_company = excluded.target_company,
  description = excluded.description,
  focus_areas = excluded.focus_areas,
  tracks = excluded.tracks,
  status = excluded.status,
  updated_at = now();

-- 14. Atomic & Idempotent Workspace Bootstrap Procedure
create or replace function public.bootstrap_initial_workspace(
  p_user_id uuid,
  p_workspace_name text,
  p_workspace_slug text,
  p_role_family text,
  p_role_name text,
  p_company_id text default null,
  p_company_name text default null,
  p_custom_company_name text default null,
  p_preferred_coding_language text default null,
  p_weekly_target_minutes integer default 600,
  p_study_days text[] default array['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::text[],
  p_default_daily_minutes integer default 120,
  p_target_date date default null,
  p_template_id text default null,
  p_total_weekly_minutes integer default 600,
  p_planned_sessions integer default 5,
  p_focus_areas text[] default array[]::text[],
  p_first_week_plan jsonb default '[]'::jsonb,
  p_starter_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace_id uuid;
  v_existing_slug text;
  v_unique_slug text;
  v_counter integer := 0;
  v_result jsonb;
begin
  -- 1. Identity validation
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED: Authentication required';
  end if;

  if auth.uid() <> p_user_id then
    raise exception 'FORBIDDEN: User cannot bootstrap workspace for another identity';
  end if;

  -- 2. Idempotency Check: if user already has an active workspace matching slug, return it
  select w.id into v_workspace_id
  from public.workspaces w
  join public.workspace_members wm on wm.workspace_id = w.id
  where wm.user_id = p_user_id
    and w.slug = p_workspace_slug
    and wm.status = 'active'
  limit 1;

  if v_workspace_id is not null then
    -- Already exists, ensure last active is set and return
    update public.profiles
    set last_active_workspace_id = v_workspace_id,
        onboarding_state = 'completed',
        onboarding_completed_at = coalesce(onboarding_completed_at, now()),
        updated_at = now()
    where id = p_user_id;

    -- Clean up draft
    delete from public.onboarding_drafts where user_id = p_user_id;

    return jsonb_build_object(
      'workspace_id', v_workspace_id,
      'workspace_slug', p_workspace_slug,
      'idempotent', true
    );
  end if;

  -- 3. Collision-resistant slug resolution
  v_unique_slug := p_workspace_slug;
  loop
    select slug into v_existing_slug from public.workspaces where slug = v_unique_slug;
    exit when v_existing_slug is null;
    v_counter := v_counter + 1;
    v_unique_slug := p_workspace_slug || '-' || v_counter;
  end loop;

  -- 4. Insert workspace
  insert into public.workspaces (
    slug,
    name,
    target_role,
    target_company,
    created_by
  )
  values (
    v_unique_slug,
    p_workspace_name,
    p_role_name,
    coalesce(p_company_name, p_custom_company_name),
    p_user_id
  )
  returning id into v_workspace_id;

  -- 5. Insert owner membership
  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    status
  )
  values (
    v_workspace_id,
    p_user_id,
    'owner',
    'active'
  );

  -- 6. Insert workspace settings
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

  -- 7. Insert workspace targets
  insert into public.workspace_targets (
    workspace_id,
    role_family,
    role_name,
    company_id,
    company_name,
    custom_company_name,
    target_date,
    template_id
  )
  values (
    v_workspace_id,
    p_role_family,
    p_role_name,
    p_company_id,
    p_company_name,
    p_custom_company_name,
    p_target_date,
    p_template_id
  );

  -- 8. Insert initial starter plan
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

  -- 9. Update profile last_active_workspace and mark onboarding completed
  update public.profiles
  set last_active_workspace_id = v_workspace_id,
      preferred_coding_language = coalesce(p_preferred_coding_language, preferred_coding_language),
      onboarding_state = 'completed',
      onboarding_completed_at = now(),
      updated_at = now()
  where id = p_user_id;

  -- 10. Clean up user's temporary onboarding draft
  delete from public.onboarding_drafts where user_id = p_user_id;

  return jsonb_build_object(
    'workspace_id', v_workspace_id,
    'workspace_slug', v_unique_slug,
    'idempotent', false
  );
end;
$$;

-- Secure function permissions: revoke from public, grant to authenticated and service_role
revoke all on function public.bootstrap_initial_workspace(
  uuid, text, text, text, text, text, text, text, text, integer, text[], integer, date, text, integer, integer, text[], jsonb, jsonb
) from public;

grant execute on function public.bootstrap_initial_workspace(
  uuid, text, text, text, text, text, text, text, text, integer, text[], integer, date, text, integer, integer, text[], jsonb, jsonb
) to authenticated;

grant execute on function public.bootstrap_initial_workspace(
  uuid, text, text, text, text, text, text, text, text, integer, text[], integer, date, text, integer, integer, text[], jsonb, jsonb
) to service_role;
