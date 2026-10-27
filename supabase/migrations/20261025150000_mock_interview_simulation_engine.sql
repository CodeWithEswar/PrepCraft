-- Phase 16: Realistic Interview Simulation, OA Environment, Evidence Capture, Evaluation & Post-Session Improvement
-- Centralized Simulation Engine reusing timestamp-authoritative Execution Engine without duplicate timers.

-- 1. Mock Blueprints
create table if not exists public.mock_blueprints (
  id text not null,
  version integer not null default 1 check (version > 0),
  name text not null check (length(name) between 1 and 120),
  description text not null default '' check (length(description) <= 2000),
  mode text not null check (mode in ('coding','cs_fundamentals','behavioral','project_deep_dive','mixed','oa','custom')),
  duration_minutes integer not null check (duration_minutes between 10 and 240),
  difficulty text not null default 'mixed' check (difficulty in ('easy','medium','hard','mixed')),
  source_type text not null check (source_type in ('platform','company_template','workspace_custom','quick_generated')),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  sections_config jsonb not null default '[]' check (jsonb_typeof(sections_config) = 'array'),
  policy_snapshot jsonb not null default '{}' check (jsonb_typeof(policy_snapshot) = 'object'),
  why_recommended jsonb not null default '[]' check (jsonb_typeof(why_recommended) = 'array'),
  status text not null default 'published' check (status in ('draft','published','deprecated','archived')),
  created_at timestamptz not null default now(),
  primary key (id, version),
  check ((source_type = 'workspace_custom') = (workspace_id is not null and user_id is not null))
);
create index if not exists mock_blueprint_owner on public.mock_blueprints(workspace_id, user_id);
create index if not exists mock_blueprint_mode on public.mock_blueprints(mode, status);

-- 2. Mock Sessions
create table if not exists public.mock_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  execution_session_id uuid not null,
  blueprint_id text,
  blueprint_version integer not null default 1,
  mode text not null check (mode in ('coding','cs_fundamentals','behavioral','project_deep_dive','mixed','oa','custom')),
  title text not null check (length(btrim(title)) between 1 and 160),
  status text not null default 'active' check (status in ('ready','active','submitting','submitted','expired','abandoned')),
  target_role_id text,
  target_company_id text,
  policy_snapshot jsonb not null default '{}' check (jsonb_typeof(policy_snapshot) = 'object'),
  selection_policy_version text not null default 'selection-policy-v1',
  evaluation_policy_version text not null default 'mock-evaluation-v1',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id, user_id),
  foreign key (execution_session_id, workspace_id, user_id) references public.execution_sessions(id, workspace_id, user_id) on delete cascade
);
create index if not exists mock_session_history on public.mock_sessions(workspace_id, user_id, created_at desc);
create index if not exists mock_session_status on public.mock_sessions(workspace_id, user_id, status);
create index if not exists mock_session_exec on public.mock_sessions(execution_session_id);

-- 3. Mock Session Sections
create table if not exists public.mock_session_sections (
  id uuid primary key default gen_random_uuid(),
  mock_session_id uuid not null,
  workspace_id uuid not null,
  user_id uuid not null,
  section_type text not null check (section_type in ('coding','dsa','cs_fundamentals','aptitude','java','sql_dbms','operating_systems','networks','behavioral','project_deep_dive','custom_question')),
  title text not null check (length(btrim(title)) between 1 and 120),
  sort_order integer not null check (sort_order >= 0),
  target_duration_seconds integer check (target_duration_seconds is null or target_duration_seconds between 60 and 14400),
  policy_snapshot jsonb not null default '{}' check (jsonb_typeof(policy_snapshot) = 'object'),
  foreign key (mock_session_id, workspace_id, user_id) references public.mock_sessions(id, workspace_id, user_id) on delete cascade,
  unique (mock_session_id, sort_order)
);
create index if not exists mock_sections_parent on public.mock_session_sections(mock_session_id, sort_order);
create index if not exists mock_sections_owner on public.mock_session_sections(workspace_id, user_id);

-- 4. Mock Session Items
create table if not exists public.mock_session_items (
  id uuid primary key default gen_random_uuid(),
  mock_session_id uuid not null,
  section_id uuid not null,
  execution_item_id uuid,
  workspace_id uuid not null,
  user_id uuid not null,
  source_type text not null check (source_type in ('question','concept','story','project','custom')),
  source_id text not null check (length(source_id) > 0),
  title text not null check (length(btrim(title)) between 1 and 160),
  sort_order integer not null check (sort_order >= 0),
  difficulty_snapshot text not null default 'medium' check (difficulty_snapshot in ('easy','medium','hard','unspecified')),
  target_duration_seconds integer check (target_duration_seconds is null or target_duration_seconds between 60 and 7200),
  status text not null default 'unseen' check (status in ('unseen','viewed','attempted','answered','flagged')),
  first_viewed_at timestamptz,
  completed_at timestamptz,
  flagged_at timestamptz,
  foreign key (mock_session_id, workspace_id, user_id) references public.mock_sessions(id, workspace_id, user_id) on delete cascade,
  foreign key (section_id) references public.mock_session_sections(id) on delete cascade,
  foreign key (execution_item_id) references public.execution_session_items(id) on delete set null,
  unique (mock_session_id, sort_order)
);
create index if not exists mock_items_parent on public.mock_session_items(mock_session_id, sort_order);
create index if not exists mock_items_section on public.mock_session_items(section_id, sort_order);
create index if not exists mock_items_owner on public.mock_session_items(workspace_id, user_id);

-- 5. Mock Session Events
create table if not exists public.mock_session_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_session_id uuid not null,
  event_type text not null check (event_type in (
    'session.started','section.entered','question.viewed','question.flagged',
    'question.unflagged','answer.saved','code.run','code.submit','hint.revealed',
    'question.completed','question.revisited','session.submitted','session.expired','session.abandoned'
  )),
  section_id uuid,
  item_id uuid,
  event_at timestamptz not null default now(),
  safe_metadata jsonb not null default '{}' check (octet_length(safe_metadata::text) <= 8000),
  foreign key (mock_session_id, workspace_id, user_id) references public.mock_sessions(id, workspace_id, user_id) on delete cascade
);
create index if not exists mock_events_timeline on public.mock_session_events(mock_session_id, event_at asc);
create index if not exists mock_events_owner on public.mock_session_events(workspace_id, user_id, event_at desc);

-- 6. Mock Reviews
create table if not exists public.mock_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_session_id uuid not null unique,
  evaluation_policy_version text not null default 'mock-evaluation-v1',
  review_snapshot jsonb not null check (octet_length(review_snapshot::text) <= 500000),
  created_at timestamptz not null default now(),
  foreign key (mock_session_id, workspace_id, user_id) references public.mock_sessions(id, workspace_id, user_id) on delete cascade
);
create index if not exists mock_reviews_owner on public.mock_reviews(workspace_id, user_id, created_at desc);

-- 7. Extend Execution Policy Check if needed
alter table public.execution_sessions drop constraint if exists execution_sessions_policy_version_check;
alter table public.execution_sessions add constraint execution_sessions_policy_version_check 
  check(policy_version in ('execution-policy-v1','behavioral-policy-v1','mock-policy-v1','oa-policy-v1'));

-- 8. Seed Platform Canonical Blueprints
insert into public.mock_blueprints (id, version, name, description, mode, duration_minutes, difficulty, source_type, sections_config, policy_snapshot, why_recommended, status)
values
  ('blueprint-amazon-sde-mixed', 1, 'Amazon SDE Technical Mock', 'Structured 60-minute simulation combining Coding DSA, CS Fundamentals, and Project Deep Dive.', 'mixed', 60, 'mixed', 'platform', 
   '[{"type":"coding","title":"Coding (DSA)","count":2,"durationMinutes":25},{"type":"cs_fundamentals","title":"CS Fundamentals","count":3,"durationMinutes":20},{"type":"project_deep_dive","title":"Project Deep Dive","count":1,"durationMinutes":15}]'::jsonb,
   '{"pausePolicy":"forbidden","navigationPolicy":"free","hintPolicy":"disabled","autoSubmit":true,"allowScratchpad":true}'::jsonb,
   '["Graph evidence is still limited","OS synchronization needs practice","Interview scheduled in 6 days"]'::jsonb, 'published'),
  ('blueprint-quick-coding-30', 1, '30 min Coding Mock', 'Timed DSA problem solving session under simulated whiteboard / assessment conditions.', 'coding', 30, 'medium', 'platform',
   '[{"type":"coding","title":"DSA Problem Solving","count":2,"durationMinutes":30}]'::jsonb,
   '{"pausePolicy":"allowed","navigationPolicy":"free","hintPolicy":"limited","autoSubmit":false,"allowScratchpad":true}'::jsonb,
   '["Recent attempts show deferred edge-case testing","Strengthen time allocation under 15 min per question"]'::jsonb, 'published'),
  ('blueprint-mixed-technical-45', 1, '45 min Mixed Technical', 'Balanced simulation across algorithms, core fundamentals, and behavioral articulation.', 'mixed', 45, 'mixed', 'platform',
   '[{"type":"coding","title":"Coding","count":1,"durationMinutes":20},{"type":"cs_fundamentals","title":"CS Fundamentals","count":4,"durationMinutes":15},{"type":"project_deep_dive","title":"Project Discussion","count":1,"durationMinutes":10}]'::jsonb,
   '{"pausePolicy":"forbidden","navigationPolicy":"free","hintPolicy":"disabled","autoSubmit":true,"allowScratchpad":true}'::jsonb,
   '["Holistic evaluation across multiple preparation dimensions"]'::jsonb, 'published'),
  ('blueprint-cs-fundamentals-20', 1, '20 min CS Fundamentals', 'Rapid-fire conceptual and objective evaluation across Java, SQL, OS, and Networks.', 'cs_fundamentals', 20, 'medium', 'platform',
   '[{"type":"cs_fundamentals","title":"Core Computer Science","count":8,"durationMinutes":20}]'::jsonb,
   '{"pausePolicy":"allowed","navigationPolicy":"free","hintPolicy":"disabled","autoSubmit":false,"allowScratchpad":false}'::jsonb,
   '["Validate depth in SQL joins and OS thread synchronization"]'::jsonb, 'published'),
  ('blueprint-behavioral-15', 1, '15 min Behavioral Mock', 'Timed articulation of STAR stories under realistic follow-up and probe constraints.', 'behavioral', 15, 'medium', 'platform',
   '[{"type":"behavioral","title":"STAR Leadership Evaluation","count":3,"durationMinutes":15}]'::jsonb,
   '{"pausePolicy":"restricted","navigationPolicy":"sequential","hintPolicy":"limited","autoSubmit":false,"allowScratchpad":true}'::jsonb,
   '["Practice executive communication without reading story notes"]'::jsonb, 'published'),
  ('blueprint-project-deepdive-30', 1, '30 min Project Deep Dive', 'Architectural trade-offs, scalability, and debugging interrogation on your personal projects.', 'project_deep_dive', 30, 'hard', 'platform',
   '[{"type":"project_deep_dive","title":"Architecture & Trade-offs","count":4,"durationMinutes":30}]'::jsonb,
   '{"pausePolicy":"allowed","navigationPolicy":"free","hintPolicy":"disabled","autoSubmit":false,"allowScratchpad":true}'::jsonb,
   '["Defend design choices and explain production failure recoveries"]'::jsonb, 'published'),
  ('blueprint-oa-simulator-60', 1, '60 min Online Assessment (OA)', 'Strict timed assessment with sequential/free navigation, no pauses, and authoritative expiration.', 'oa', 60, 'hard', 'platform',
   '[{"type":"coding","title":"Online Assessment Problems","count":3,"durationMinutes":60}]'::jsonb,
   '{"pausePolicy":"forbidden","navigationPolicy":"free","hintPolicy":"forbidden","autoSubmit":true,"allowScratchpad":true}'::jsonb,
   '["Simulate strict company test environments with automatic deadline enforcement"]'::jsonb, 'published')
on conflict (id, version) do update set
  name = excluded.name,
  description = excluded.description,
  sections_config = excluded.sections_config,
  policy_snapshot = excluded.policy_snapshot,
  why_recommended = excluded.why_recommended;

-- 9. Row Level Security & Grants
do $$
declare t text;
begin
  foreach t in array array['mock_blueprints','mock_sessions','mock_session_sections','mock_session_items','mock_session_events','mock_reviews'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Policies for mock_blueprints (Platform templates are readable by any authenticated user; workspace custom by owner)
create policy mock_blueprint_read on public.mock_blueprints for select to authenticated
  using (source_type in ('platform','company_template') or (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id)));

create policy mock_blueprint_write on public.mock_blueprints for all to authenticated
  using (source_type = 'workspace_custom' and user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  with check (source_type = 'workspace_custom' and user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));

-- Policies for session data (Strict workspace and user ownership)
create policy mock_session_owner on public.mock_sessions for all to authenticated
  using (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  with check (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));

create policy mock_section_owner on public.mock_session_sections for all to authenticated
  using (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  with check (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));

create policy mock_item_owner on public.mock_session_items for all to authenticated
  using (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  with check (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));

create policy mock_event_owner on public.mock_session_events for all to authenticated
  using (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  with check (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));

create policy mock_review_owner on public.mock_reviews for all to authenticated
  using (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  with check (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));
