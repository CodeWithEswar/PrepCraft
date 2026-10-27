-- Migration: Versioned Preparation Templates & Curriculum Engine
-- Author: PrepCraft Architecture Team
-- Timestamp: 20261024220000

-- ============================================================================
-- 1. CANONICAL CATALOGS: TRACKS, TOPICS, AND PATTERNS
-- ============================================================================

create table if not exists public.tracks (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text,
  category text not null default 'core' check (category in ('core', 'systems', 'practical', 'evaluative')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tracks_category on public.tracks(category, is_active, sort_order);

create table if not exists public.topics (
  id text primary key,
  track_id text not null references public.tracks(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  importance_level text not null default 'high' check (importance_level in ('core', 'high', 'medium', 'low')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_topics_track_id on public.topics(track_id, is_active, sort_order);

create table if not exists public.patterns (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text,
  typical_difficulty text not null default 'medium' check (typical_difficulty in ('easy', 'medium', 'hard')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patterns_difficulty on public.patterns(typical_difficulty, is_active);

-- ============================================================================
-- 2. ENHANCE PREPARATION_TEMPLATES (IDENTITY & PUBLISHING METADATA)
-- ============================================================================

-- Ensure preparation_templates has all identity, taxonomy, and version linkage fields
alter table public.preparation_templates
  add column if not exists slug text unique,
  add column if not exists short_name text,
  add column if not exists company_id text references public.companies(id) on delete set null,
  add column if not exists role_id text references public.roles(id) on delete set null,
  add column if not exists template_type text not null default 'general' check (template_type in ('general', 'company', 'role', 'company_role', 'custom')),
  add column if not exists visibility text not null default 'public' check (visibility in ('public', 'internal', 'private')),
  add column if not exists current_published_version_id uuid;

-- Update status check constraint to support versioned lifecycle
alter table public.preparation_templates
  drop constraint if exists preparation_templates_status_check;

alter table public.preparation_templates
  add constraint preparation_templates_status_check
  check (status in ('active', 'draft', 'review', 'published', 'deprecated', 'archived'));

-- Backfill slug with id if missing
update public.preparation_templates
set slug = id
where slug is null;

alter table public.preparation_templates alter column slug set not null;

create index if not exists idx_prep_templates_discovery on public.preparation_templates(status, visibility, template_type);
create index if not exists idx_prep_templates_targeting on public.preparation_templates(company_id, role_id);

-- ============================================================================
-- 3. TEMPLATE VERSIONS (IMMUTABLE PUBLISHED DEFINITIONS)
-- ============================================================================

create table if not exists public.preparation_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id text not null references public.preparation_templates(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  status text not null default 'published' check (status in ('draft', 'review', 'published', 'deprecated', 'archived')),
  change_summary text,
  published_at timestamptz,
  reviewed_at timestamptz,
  deprecated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_template_version unique (template_id, version_number)
);

create index if not exists idx_template_versions_lookup on public.preparation_template_versions(template_id, status, version_number desc);

-- Foreign key link back to current published version
alter table public.preparation_templates
  drop constraint if exists fk_prep_templates_current_version;
alter table public.preparation_templates
  add constraint fk_prep_templates_current_version
  foreign key (current_published_version_id) references public.preparation_template_versions(id) on delete set null;

-- ============================================================================
-- 4. CURRICULUM DEFINITION (VERSION-SCOPED TRACKS, TOPICS, PATTERNS, STAGES)
-- ============================================================================

create table if not exists public.template_version_tracks (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.preparation_template_versions(id) on delete cascade,
  track_id text not null references public.tracks(id) on delete cascade,
  priority text not null default 'high' check (priority in ('core', 'high', 'medium', 'low', 'optional')),
  weight integer not null default 20 check (weight >= 0 and weight <= 100),
  recommended_minutes_percent integer check (recommended_minutes_percent >= 0 and recommended_minutes_percent <= 100),
  sort_order integer not null default 0,
  required boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  constraint uq_template_version_track unique (template_version_id, track_id)
);

create index if not exists idx_tv_tracks_order on public.template_version_tracks(template_version_id, sort_order);

create table if not exists public.template_version_topics (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.preparation_template_versions(id) on delete cascade,
  track_id text not null references public.tracks(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  priority text not null default 'high' check (priority in ('core', 'high', 'medium', 'low', 'optional')),
  weight integer not null default 10 check (weight >= 0 and weight <= 100),
  recommended_question_count integer default 10 check (recommended_question_count >= 0),
  recommended_revision_depth integer default 2 check (recommended_revision_depth >= 1),
  sort_order integer not null default 0,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  constraint uq_template_version_topic unique (template_version_id, topic_id)
);

create index if not exists idx_tv_topics_track on public.template_version_topics(template_version_id, track_id, sort_order);

create table if not exists public.template_version_patterns (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.preparation_template_versions(id) on delete cascade,
  pattern_id text not null references public.patterns(id) on delete cascade,
  priority text not null default 'high' check (priority in ('core', 'high', 'medium', 'low', 'optional')),
  recommended_attempts integer default 5 check (recommended_attempts >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint uq_template_version_pattern unique (template_version_id, pattern_id)
);

create index if not exists idx_tv_patterns_order on public.template_version_patterns(template_version_id, sort_order);

create table if not exists public.template_interview_stages (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.preparation_template_versions(id) on delete cascade,
  name text not null,
  stage_type text not null check (stage_type in ('oa', 'coding', 'technical', 'behavioral', 'project', 'system_design', 'managerial', 'other')),
  sort_order integer not null default 0,
  optional boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tv_stages_order on public.template_interview_stages(template_version_id, sort_order);

create table if not exists public.template_readiness_requirements (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.preparation_template_versions(id) on delete cascade,
  dimension text not null check (dimension in ('dsa', 'programming_language', 'cs_fundamentals', 'projects', 'behavioral', 'timed_practice')),
  minimum_evidence text not null,
  weight integer not null default 20 check (weight >= 0 and weight <= 100),
  required boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 5. WORKSPACE CURRICULUM MODEL (VERSION-PINNED WORKSPACE PREPARATION)
-- ============================================================================

create table if not exists public.workspace_curricula (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade unique,
  template_id text not null references public.preparation_templates(id),
  template_version_id uuid not null references public.preparation_template_versions(id),
  version_number integer not null check (version_number > 0),
  status text not null default 'active' check (status in ('active', 'customized', 'archived')),
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workspace_curricula_ws on public.workspace_curricula(workspace_id);
create index if not exists idx_workspace_curricula_version on public.workspace_curricula(template_version_id);

create table if not exists public.workspace_curriculum_overrides (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_type text not null check (entity_type in ('track', 'topic', 'pattern')),
  entity_id text not null,
  override_type text not null check (override_type in ('priority', 'weight', 'inclusion')),
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_ws_override unique (workspace_id, entity_type, entity_id, override_type)
);

create index if not exists idx_ws_overrides on public.workspace_curriculum_overrides(workspace_id, entity_type);

-- Triggers for updated_at
drop trigger if exists set_tracks_updated_at on public.tracks;
create trigger set_tracks_updated_at before update on public.tracks
  for each row execute function public.handle_updated_at();

drop trigger if exists set_topics_updated_at on public.topics;
create trigger set_topics_updated_at before update on public.topics
  for each row execute function public.handle_updated_at();

drop trigger if exists set_patterns_updated_at on public.patterns;
create trigger set_patterns_updated_at before update on public.patterns
  for each row execute function public.handle_updated_at();

drop trigger if exists set_template_versions_updated_at on public.preparation_template_versions;
create trigger set_template_versions_updated_at before update on public.preparation_template_versions
  for each row execute function public.handle_updated_at();

drop trigger if exists set_workspace_curricula_updated_at on public.workspace_curricula;
create trigger set_workspace_curricula_updated_at before update on public.workspace_curricula
  for each row execute function public.handle_updated_at();

drop trigger if exists set_ws_overrides_updated_at on public.workspace_curriculum_overrides;
create trigger set_ws_overrides_updated_at before update on public.workspace_curriculum_overrides
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.tracks enable row level security;
alter table public.topics enable row level security;
alter table public.patterns enable row level security;
alter table public.preparation_template_versions enable row level security;
alter table public.template_version_tracks enable row level security;
alter table public.template_version_topics enable row level security;
alter table public.template_version_patterns enable row level security;
alter table public.template_interview_stages enable row level security;
alter table public.template_readiness_requirements enable row level security;
alter table public.workspace_curricula enable row level security;
alter table public.workspace_curriculum_overrides enable row level security;

-- Canonical catalog reads (Tracks, Topics, Patterns)
create policy "Allow read access to active tracks"
  on public.tracks for select
  to authenticated, anon
  using (is_active = true);

create policy "Allow read access to active topics"
  on public.topics for select
  to authenticated, anon
  using (is_active = true);

create policy "Allow read access to active patterns"
  on public.patterns for select
  to authenticated, anon
  using (is_active = true);

-- Published template versions and curriculum components
create policy "Allow read access to published template versions"
  on public.preparation_template_versions for select
  to authenticated, anon
  using (status = 'published');

create policy "Allow read access to published version tracks"
  on public.template_version_tracks for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.preparation_template_versions v
      where v.id = template_version_tracks.template_version_id
        and v.status = 'published'
    )
  );

create policy "Allow read access to published version topics"
  on public.template_version_topics for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.preparation_template_versions v
      where v.id = template_version_topics.template_version_id
        and v.status = 'published'
    )
  );

create policy "Allow read access to published version patterns"
  on public.template_version_patterns for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.preparation_template_versions v
      where v.id = template_version_patterns.template_version_id
        and v.status = 'published'
    )
  );

create policy "Allow read access to published interview stages"
  on public.template_interview_stages for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.preparation_template_versions v
      where v.id = template_interview_stages.template_version_id
        and v.status = 'published'
    )
  );

create policy "Allow read access to published readiness requirements"
  on public.template_readiness_requirements for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.preparation_template_versions v
      where v.id = template_readiness_requirements.template_version_id
        and v.status = 'published'
    )
  );

-- Workspace Curriculum RLS: isolated to active workspace members
create policy "Workspace members can view workspace curriculum"
  on public.workspace_curricula for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Workspace owners can insert workspace curriculum"
  on public.workspace_curricula for insert
  to authenticated
  with check (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can update workspace curriculum"
  on public.workspace_curricula for update
  to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

-- Workspace Curriculum Overrides RLS
create policy "Workspace members can view overrides"
  on public.workspace_curriculum_overrides for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Workspace owners can manage overrides"
  on public.workspace_curriculum_overrides for all
  to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

-- Explicit grants to authenticated and anon roles for Data API
grant select on public.tracks to authenticated, anon;
grant select on public.topics to authenticated, anon;
grant select on public.patterns to authenticated, anon;
grant select on public.preparation_template_versions to authenticated, anon;
grant select on public.template_version_tracks to authenticated, anon;
grant select on public.template_version_topics to authenticated, anon;
grant select on public.template_version_patterns to authenticated, anon;
grant select on public.template_interview_stages to authenticated, anon;
grant select on public.template_readiness_requirements to authenticated, anon;
grant select, insert, update on public.workspace_curricula to authenticated;
grant select, insert, update, delete on public.workspace_curriculum_overrides to authenticated;

-- ============================================================================
-- 7. TRANSACTIONAL TEMPLATE APPLICATION PROCEDURE
-- ============================================================================

create or replace function public.apply_template_to_workspace(
  p_workspace_id uuid,
  p_template_id text,
  p_version_number integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_version_id uuid;
  v_version_num integer;
  v_template_exists boolean;
  v_is_owner boolean;
  v_curriculum_id uuid;
  v_previous_version integer;
  v_event_type text;
begin
  -- 1. Check workspace owner authorization
  v_is_owner := public.is_workspace_owner(p_workspace_id);
  if not v_is_owner then
    return jsonb_build_object('success', false, 'error', 'Permission denied. Only workspace owners can apply preparation templates.');
  end if;

  -- 2. Verify template exists and is published
  select exists (
    select 1 from public.preparation_templates
    where id = p_template_id and status in ('published', 'active')
  ) into v_template_exists;

  if not v_template_exists then
    return jsonb_build_object('success', false, 'error', 'The requested preparation template does not exist or is not available.');
  end if;

  -- 3. Resolve the target published template version
  if p_version_number is not null then
    select id, version_number into v_version_id, v_version_num
    from public.preparation_template_versions
    where template_id = p_template_id
      and version_number = p_version_number
      and status = 'published';
  else
    select id, version_number into v_version_id, v_version_num
    from public.preparation_template_versions
    where template_id = p_template_id
      and status = 'published'
    order by version_number desc
    limit 1;
  end if;

  if v_version_id is null then
    return jsonb_build_object('success', false, 'error', 'No published version available for the selected template.');
  end if;

  -- Check existing curriculum version for upgrade vs fresh apply
  select version_number into v_previous_version
  from public.workspace_curricula
  where workspace_id = p_workspace_id;

  if v_previous_version is not null and v_previous_version <> v_version_num then
    v_event_type := 'template.upgraded';
  else
    v_event_type := 'template.applied';
  end if;

  -- 4. Idempotently apply or update workspace_curricula
  insert into public.workspace_curricula (
    workspace_id,
    template_id,
    template_version_id,
    version_number,
    status,
    applied_at,
    updated_at
  )
  values (
    p_workspace_id,
    p_template_id,
    v_version_id,
    v_version_num,
    'active',
    now(),
    now()
  )
  on conflict (workspace_id) do update set
    template_id = excluded.template_id,
    template_version_id = excluded.template_version_id,
    version_number = excluded.version_number,
    status = 'active',
    updated_at = now()
  returning id into v_curriculum_id;

  -- 5. Pin template and version on workspace_targets
  update public.workspace_targets
  set template_id = p_template_id,
      template_version = v_version_num,
      updated_at = now()
  where workspace_id = p_workspace_id;

  -- 6. Emit activity event for audit & notification stream
  insert into public.workspace_activity_events (
    workspace_id,
    user_id,
    event_type,
    payload
  )
  values (
    p_workspace_id,
    (select auth.uid()),
    v_event_type,
    jsonb_build_object(
      'templateId', p_template_id,
      'versionNumber', v_version_num,
      'previousVersion', v_previous_version,
      'versionId', v_version_id
    )
  );

  return jsonb_build_object(
    'success', true,
    'curriculumId', v_curriculum_id,
    'templateId', p_template_id,
    'versionNumber', v_version_num,
    'versionId', v_version_id,
    'eventType', v_event_type
  );
end;
$$;

-- ============================================================================
-- 8. CANONICAL CATALOG SEED DATA
-- ============================================================================

-- Canonical Tracks
insert into public.tracks (id, slug, name, description, category, sort_order)
values
  ('dsa', 'dsa', 'Data Structures & Algorithms', 'Foundational and advanced data structures, algorithmic paradigms, and runtime complexity.', 'core', 1),
  ('programming-language', 'programming-language', 'Programming Language Mastery', 'Memory model, language idioms, standard libraries, and runtime semantics.', 'core', 2),
  ('cs-fundamentals', 'cs-fundamentals', 'Core CS Fundamentals', 'Operating systems, computer networks, concurrency, and architecture trade-offs.', 'systems', 3),
  ('databases-sql', 'databases-sql', 'Databases & Query Engineering', 'Relational modeling, indexing, ACID transactions, and query performance.', 'systems', 4),
  ('system-design', 'system-design', 'System Architecture & Scalability', 'Distributed design, caching strategies, rate limiters, and microservices reliability.', 'systems', 5),
  ('projects', 'projects', 'Project Architecture & Defense', 'Explaining real architectural choices, failure handling, and technical trade-offs.', 'practical', 6),
  ('behavioral', 'behavioral', 'Behavioral & Leadership Stories', 'Structured STAR narratives, technical conflict resolution, and leadership principles.', 'evaluative', 7),
  ('oa-preparation', 'oa-preparation', 'Timed Online Assessment (OA)', 'Fast-paced algorithmic tests, test-case debugging, and speed-optimized coding.', 'evaluative', 8)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  sort_order = excluded.sort_order;

-- Canonical Topics
insert into public.topics (id, track_id, slug, name, description, importance_level, sort_order)
values
  -- DSA Topics
  ('dsa-arrays', 'dsa', 'arrays-hashing', 'Arrays & Hash Maps', 'Contiguous memory, prefix sums, lookup tables, and frequency counts.', 'core', 1),
  ('dsa-two-pointers', 'dsa', 'two-pointers', 'Two Pointers & Sliding Window', 'Linear traversal optimization, convergent pointers, and window bounds.', 'core', 2),
  ('dsa-binary-search', 'dsa', 'binary-search', 'Binary Search & Monotonic Spaces', 'Search spaces, predicate boundary finding, and rotated arrays.', 'core', 3),
  ('dsa-trees', 'dsa', 'trees-traversal', 'Trees & Binary Search Trees', 'Recursive traversals, height/depth computation, LCA, and BST properties.', 'core', 4),
  ('dsa-graphs', 'dsa', 'graphs-bfs-dfs', 'Graphs, BFS & DFS', 'Adjacency lists, shortest paths, connected components, and topological sort.', 'high', 5),
  ('dsa-heaps', 'dsa', 'heaps-priority-queues', 'Heaps & Priority Queues', 'Min/max heaps, top-K frequent elements, and streaming medians.', 'high', 6),
  ('dsa-dp', 'dsa', 'dynamic-programming', 'Dynamic Programming & Memoization', 'Optimal substructure, overlapping subproblems, 1D/2D memoization.', 'high', 7),
  ('dsa-backtracking', 'dsa', 'backtracking', 'Backtracking & Combinations', 'Permutations, subsets, constraints validation, and state pruning.', 'medium', 8),

  -- Programming Language Topics
  ('lang-memory', 'programming-language', 'memory-model-gc', 'Memory Model & Garbage Collection', 'Stack vs heap allocation, reference semantics, and garbage collection pauses.', 'core', 1),
  ('lang-collections', 'programming-language', 'collections-internals', 'Standard Collections & Data Structures', 'ArrayList, HashMap collision buckets, TreeSet red-black trees, and iteration costs.', 'core', 2),
  ('lang-concurrency', 'programming-language', 'threads-locks-async', 'Threading, Locks & Async Primitives', 'Volatile semantics, synchronized blocks, virtual threads, and futures.', 'high', 3),

  -- CS Fundamentals Topics
  ('cs-os-concurrency', 'cs-fundamentals', 'os-processes-threads', 'Processes, Threads & Deadlocks', 'Process address space, thread context switching, race conditions, and avoidance.', 'core', 1),
  ('cs-networking', 'cs-fundamentals', 'tcp-udp-http', 'Computer Networks & HTTP/DNS', 'TCP 3-way handshake, connection resets, TLS handshakes, and DNS resolution.', 'high', 2),

  -- Databases & SQL Topics
  ('db-indexing', 'databases-sql', 'b-tree-indexing', 'Indexing & Query Plans (EXPLAIN)', 'B-tree index lookups, composite index ordering, and table scans.', 'core', 1),
  ('db-transactions', 'databases-sql', 'acid-isolation-locks', 'Transactions & Isolation Levels', 'Dirty reads, repeatable reads, MVCC, and pessimistic vs optimistic locks.', 'high', 2),

  -- Project Defense Topics
  ('proj-architecture', 'projects', 'system-choices-tradeoffs', 'Architecture & Choice Defense', 'Why this stack, what fails first, and trade-offs made at scale.', 'core', 1),
  ('proj-failure-modes', 'projects', 'failure-handling-recovery', 'Failure Handling & Resiliency', 'Circuit breaking, graceful degradation, idempotency, and retries.', 'high', 2),

  -- Behavioral Topics
  ('beh-ownership', 'behavioral', 'ownership-deliver-results', 'Ownership & Delivering Results', 'Taking accountability, overcoming blockers, and delivering customer value.', 'core', 1),
  ('beh-conflict', 'behavioral', 'technical-conflict-tradeoffs', 'Technical Disagreement & Influence', 'Navigating disagreements with data, consensus building, and retrospectives.', 'high', 2),

  -- OA Topics
  ('oa-simulation', 'oa-preparation', 'timed-oa-simulation', 'Timed OA Simulation & Speed', 'Completing 2 algorithmic problems within 70 minutes with edge cases.', 'high', 1)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  importance_level = excluded.importance_level,
  sort_order = excluded.sort_order;

-- Canonical Patterns
insert into public.patterns (id, slug, name, description, typical_difficulty)
values
  ('frequency-map', 'frequency-map', 'Frequency Map / Anagram Bucket', 'Hash-based counting of character or element frequencies.', 'easy'),
  ('two-pointers', 'two-pointers', 'Two Pointers (Convergent)', 'Pointers moving inward from both ends to find pairs or partitions.', 'easy'),
  ('sliding-window', 'sliding-window', 'Sliding Window (Dynamic/Fixed)', 'Subarray maintenance with expansion and contraction criteria.', 'medium'),
  ('prefix-sum', 'prefix-sum', 'Prefix Sum Array', 'Precomputing cumulative sums for O(1) range queries.', 'easy'),
  ('fast-slow-pointers', 'fast-slow-pointers', 'Fast & Slow Pointers (Floyd)', 'Cycle detection in linked lists and middle-element finding.', 'easy'),
  ('monotonic-stack', 'monotonic-stack', 'Monotonic Stack / Queue', 'Maintaining monotonic increasing/decreasing order for next-greater elements.', 'medium'),
  ('binary-search-space', 'binary-search-space', 'Binary Search on Solution Space', 'Minimizing maximums or searching across predicate-monotonic values.', 'medium'),
  ('bfs-level-order', 'bfs-level-order', 'BFS Level-Order Traversal', 'Queue-driven shortest path search in unweighted graphs or trees.', 'medium'),
  ('dfs-backtracking', 'dfs-backtracking', 'DFS & Backtracking Tree', 'Exploring state spaces with recursion and rollback.', 'medium'),
  ('topological-sort', 'topological-sort', 'Topological Sort (Kahn / DFS)', 'Ordering dependent tasks in directed acyclic graphs (DAG).', 'medium'),
  ('heap-top-k', 'heap-top-k', 'Top-K Heap Streaming', 'Maintaining fixed-size heap for bounded streaming rank queries.', 'medium'),
  ('dp-tabulation', 'dp-tabulation', '1D/2D Dynamic Programming Tabulation', 'Bottom-up table filling from base states to target answer.', 'hard')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  typical_difficulty = excluded.typical_difficulty;

-- ============================================================================
-- 9. STARTER TEMPLATES & VERSIONED CURRICULUM SEEDING
-- ============================================================================

-- Function to seed starter templates idempotently
do $$
declare
  v_amazon_template_id text := 'amazon-sde';
  v_general_template_id text := 'general-swe';
  v_frontend_template_id text := 'frontend-engineer';
  v_backend_template_id text := 'backend-engineer';
  v_fullstack_template_id text := 'fullstack-engineer';

  v_amazon_v1_id uuid;
  v_amazon_v2_id uuid;
  v_general_v1_id uuid;
  v_frontend_v1_id uuid;
  v_backend_v1_id uuid;
  v_fullstack_v1_id uuid;
begin
  -- --------------------------------------------------------------------------
  -- 1. AMAZON SDE TEMPLATE (v1 & v2 for upgrade diff demonstration)
  -- --------------------------------------------------------------------------
  insert into public.preparation_templates (
    id, slug, name, short_name, role_family, target_company, company_id, role_id, template_type, status, visibility, description
  )
  values (
    v_amazon_template_id, 'amazon-sde', 'Amazon Software Engineer', 'Amazon SDE', 'Software Engineer', 'Amazon', 'amazon', 'software-engineer', 'company_role', 'published', 'public',
    'Comprehensive curriculum targeted at Amazon Online Assessments (OA), Data Structures, Core CS trade-offs, and Leadership Principles.'
  )
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_name = excluded.short_name,
    company_id = excluded.company_id,
    role_id = excluded.role_id,
    template_type = excluded.template_type,
    description = excluded.description,
    status = excluded.status,
    visibility = excluded.visibility;

  -- Amazon SDE Version 1
  insert into public.preparation_template_versions (
    template_id, version_number, status, change_summary, published_at
  )
  values (
    v_amazon_template_id, 1, 'published', 'Initial Amazon SDE baseline curriculum emphasizing OA simulation, core DSA patterns, and Customer Obsession.', now() - interval '90 days'
  )
  on conflict (template_id, version_number) do update set
    status = excluded.status
  returning id into v_amazon_v1_id;

  -- Amazon SDE Version 2 (Upgrade available)
  insert into public.preparation_template_versions (
    template_id, version_number, status, change_summary, published_at
  )
  values (
    v_amazon_template_id, 2, 'published', 'Updated Amazon SDE curriculum: elevated Graph fundamentals and Monotonic Stack priorities based on recent assessment patterns.', now() - interval '7 days'
  )
  on conflict (template_id, version_number) do update set
    status = excluded.status,
    change_summary = excluded.change_summary
  returning id into v_amazon_v2_id;

  -- Point current published version to v2
  update public.preparation_templates
  set current_published_version_id = v_amazon_v2_id
  where id = v_amazon_template_id;

  -- Amazon v1 Curriculum Tracks
  insert into public.template_version_tracks (template_version_id, track_id, priority, weight, sort_order)
  values
    (v_amazon_v1_id, 'dsa', 'core', 40, 1),
    (v_amazon_v1_id, 'behavioral', 'core', 20, 2),
    (v_amazon_v1_id, 'cs-fundamentals', 'high', 15, 3),
    (v_amazon_v1_id, 'oa-preparation', 'high', 15, 4),
    (v_amazon_v1_id, 'projects', 'medium', 10, 5)
  on conflict (template_version_id, track_id) do update set weight = excluded.weight;

  -- Amazon v1 Topics
  insert into public.template_version_topics (template_version_id, track_id, topic_id, priority, weight, sort_order)
  values
    (v_amazon_v1_id, 'dsa', 'dsa-arrays', 'core', 15, 1),
    (v_amazon_v1_id, 'dsa', 'dsa-two-pointers', 'core', 15, 2),
    (v_amazon_v1_id, 'dsa', 'dsa-trees', 'high', 10, 3),
    (v_amazon_v1_id, 'behavioral', 'beh-ownership', 'core', 15, 4),
    (v_amazon_v1_id, 'behavioral', 'beh-conflict', 'high', 10, 5),
    (v_amazon_v1_id, 'oa-preparation', 'oa-simulation', 'high', 15, 6),
    (v_amazon_v1_id, 'projects', 'proj-architecture', 'medium', 10, 7)
  on conflict (template_version_id, topic_id) do update set priority = excluded.priority;

  -- Amazon v2 Curriculum Tracks (Graph elevated, OA refined)
  insert into public.template_version_tracks (template_version_id, track_id, priority, weight, sort_order)
  values
    (v_amazon_v2_id, 'dsa', 'core', 40, 1),
    (v_amazon_v2_id, 'behavioral', 'core', 20, 2),
    (v_amazon_v2_id, 'cs-fundamentals', 'high', 15, 3),
    (v_amazon_v2_id, 'oa-preparation', 'high', 15, 4),
    (v_amazon_v2_id, 'projects', 'medium', 10, 5)
  on conflict (template_version_id, track_id) do update set weight = excluded.weight;

  -- Amazon v2 Topics (includes Graph fundamentals added)
  insert into public.template_version_topics (template_version_id, track_id, topic_id, priority, weight, sort_order)
  values
    (v_amazon_v2_id, 'dsa', 'dsa-arrays', 'core', 12, 1),
    (v_amazon_v2_id, 'dsa', 'dsa-two-pointers', 'core', 12, 2),
    (v_amazon_v2_id, 'dsa', 'dsa-trees', 'core', 10, 3),
    (v_amazon_v2_id, 'dsa', 'dsa-graphs', 'high', 10, 4), -- Added in v2
    (v_amazon_v2_id, 'behavioral', 'beh-ownership', 'core', 15, 5),
    (v_amazon_v2_id, 'behavioral', 'beh-conflict', 'high', 10, 6),
    (v_amazon_v2_id, 'oa-preparation', 'oa-simulation', 'high', 15, 7),
    (v_amazon_v2_id, 'projects', 'proj-architecture', 'medium', 10, 8)
  on conflict (template_version_id, topic_id) do update set priority = excluded.priority;

  -- Amazon Stages & Readiness
  insert into public.template_interview_stages (template_version_id, name, stage_type, sort_order, description)
  values
    (v_amazon_v2_id, 'Online Assessment (OA)', 'oa', 1, '2 algorithmic questions (70 min) + Work Style simulation.'),
    (v_amazon_v2_id, 'Technical Coding Round', 'coding', 2, 'Live coding on data structures, algorithmic complexity, and edge cases.'),
    (v_amazon_v2_id, 'System & Behavioral Round', 'behavioral', 3, 'Deep-dive into past project architecture and Leadership Principles.')
  on conflict do nothing;

  insert into public.template_readiness_requirements (template_version_id, dimension, minimum_evidence, weight)
  values
    (v_amazon_v2_id, 'dsa', 'Solid mastery across Arrays, Two Pointers, Trees, and Graph BFS.', 40),
    (v_amazon_v2_id, 'behavioral', 'At least 4 verified STAR stories aligned to Amazon Leadership Principles.', 25),
    (v_amazon_v2_id, 'timed_practice', 'Passing 3 consecutive timed OA mock simulations.', 20),
    (v_amazon_v2_id, 'projects', 'Clear articulation of personal technical decisions and failure modes.', 15)
  on conflict do nothing;

  -- --------------------------------------------------------------------------
  -- 2. GENERAL SOFTWARE ENGINEER TEMPLATE (Universal Fallback)
  -- --------------------------------------------------------------------------
  insert into public.preparation_templates (
    id, slug, name, short_name, role_family, target_company, company_id, role_id, template_type, status, visibility, description
  )
  values (
    v_general_template_id, 'general-swe', 'General Software Engineer', 'General SDE', 'Software Engineer', null, null, 'software-engineer', 'general', 'published', 'public',
    'Curated multi-round curriculum covering patterns, algorithms, system concepts, and behavioral competencies for ₹10+ LPA engineering interviews.'
  )
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_name = excluded.short_name,
    company_id = excluded.company_id,
    role_id = excluded.role_id,
    template_type = excluded.template_type,
    description = excluded.description,
    status = excluded.status,
    visibility = excluded.visibility;

  insert into public.preparation_template_versions (
    template_id, version_number, status, change_summary, published_at
  )
  values (
    v_general_template_id, 1, 'published', 'Initial universal software engineer curriculum benchmarked across top-tier and product companies.', now()
  )
  on conflict (template_id, version_number) do update set status = excluded.status
  returning id into v_general_v1_id;

  update public.preparation_templates
  set current_published_version_id = v_general_v1_id
  where id = v_general_template_id;

  insert into public.template_version_tracks (template_version_id, track_id, priority, weight, sort_order)
  values
    (v_general_v1_id, 'dsa', 'core', 35, 1),
    (v_general_v1_id, 'programming-language', 'high', 15, 2),
    (v_general_v1_id, 'cs-fundamentals', 'high', 15, 3),
    (v_general_v1_id, 'databases-sql', 'high', 15, 4),
    (v_general_v1_id, 'projects', 'medium', 10, 5),
    (v_general_v1_id, 'behavioral', 'medium', 10, 6)
  on conflict (template_version_id, track_id) do update set weight = excluded.weight;

  insert into public.template_version_topics (template_version_id, track_id, topic_id, priority, weight, sort_order)
  values
    (v_general_v1_id, 'dsa', 'dsa-arrays', 'core', 10, 1),
    (v_general_v1_id, 'dsa', 'dsa-two-pointers', 'core', 10, 2),
    (v_general_v1_id, 'dsa', 'dsa-trees', 'high', 10, 3),
    (v_general_v1_id, 'dsa', 'dsa-binary-search', 'high', 8, 4),
    (v_general_v1_id, 'programming-language', 'lang-memory', 'high', 8, 5),
    (v_general_v1_id, 'databases-sql', 'db-indexing', 'high', 10, 6),
    (v_general_v1_id, 'cs-fundamentals', 'cs-os-concurrency', 'high', 8, 7),
    (v_general_v1_id, 'projects', 'proj-architecture', 'medium', 8, 8),
    (v_general_v1_id, 'behavioral', 'beh-ownership', 'medium', 8, 9)
  on conflict (template_version_id, topic_id) do update set priority = excluded.priority;

  -- --------------------------------------------------------------------------
  -- 3. FRONTEND ENGINEER TEMPLATE
  -- --------------------------------------------------------------------------
  insert into public.preparation_templates (
    id, slug, name, short_name, role_family, target_company, company_id, role_id, template_type, status, visibility, description
  )
  values (
    v_frontend_template_id, 'frontend-engineer', 'Frontend Engineer', 'Frontend', 'Frontend Engineer', null, null, 'frontend-engineer', 'role', 'published', 'public',
    'Focused curriculum on modern JavaScript, browser internals, component architecture, CSS layout, and accessibility.'
  )
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_name = excluded.short_name,
    company_id = excluded.company_id,
    role_id = excluded.role_id,
    template_type = excluded.template_type,
    description = excluded.description,
    status = excluded.status,
    visibility = excluded.visibility;

  insert into public.preparation_template_versions (
    template_id, version_number, status, change_summary, published_at
  )
  values (
    v_frontend_template_id, 1, 'published', 'Initial Frontend Engineer curriculum with emphasis on JavaScript runtime, DOM, and UI architecture.', now()
  )
  on conflict (template_id, version_number) do update set status = excluded.status
  returning id into v_frontend_v1_id;

  update public.preparation_templates
  set current_published_version_id = v_frontend_v1_id
  where id = v_frontend_template_id;

  insert into public.template_version_tracks (template_version_id, track_id, priority, weight, sort_order)
  values
    (v_frontend_v1_id, 'programming-language', 'core', 35, 1),
    (v_frontend_v1_id, 'projects', 'core', 25, 2),
    (v_frontend_v1_id, 'dsa', 'high', 20, 3),
    (v_frontend_v1_id, 'cs-fundamentals', 'medium', 10, 4),
    (v_frontend_v1_id, 'behavioral', 'medium', 10, 5)
  on conflict (template_version_id, track_id) do update set weight = excluded.weight;

  -- --------------------------------------------------------------------------
  -- 4. BACKEND ENGINEER TEMPLATE
  -- --------------------------------------------------------------------------
  insert into public.preparation_templates (
    id, slug, name, short_name, role_family, target_company, company_id, role_id, template_type, status, visibility, description
  )
  values (
    v_backend_template_id, 'backend-engineer', 'Backend Engineer', 'Backend', 'Backend Engineer', null, null, 'backend-engineer', 'role', 'published', 'public',
    'Dedicated preparation for distributed backend systems, database indexing, concurrency, and API reliability.'
  )
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_name = excluded.short_name,
    company_id = excluded.company_id,
    role_id = excluded.role_id,
    template_type = excluded.template_type,
    description = excluded.description,
    status = excluded.status,
    visibility = excluded.visibility;

  insert into public.preparation_template_versions (
    template_id, version_number, status, change_summary, published_at
  )
  values (
    v_backend_template_id, 1, 'published', 'Initial Backend Engineer curriculum with database query plans and distributed state fundamentals.', now()
  )
  on conflict (template_id, version_number) do update set status = excluded.status
  returning id into v_backend_v1_id;

  update public.preparation_templates
  set current_published_version_id = v_backend_v1_id
  where id = v_backend_template_id;

  insert into public.template_version_tracks (template_version_id, track_id, priority, weight, sort_order)
  values
    (v_backend_v1_id, 'databases-sql', 'core', 30, 1),
    (v_backend_v1_id, 'dsa', 'core', 25, 2),
    (v_backend_v1_id, 'cs-fundamentals', 'high', 20, 3),
    (v_backend_v1_id, 'projects', 'high', 15, 4),
    (v_backend_v1_id, 'behavioral', 'medium', 10, 5)
  on conflict (template_version_id, track_id) do update set weight = excluded.weight;

  -- --------------------------------------------------------------------------
  -- 5. FULL-STACK ENGINEER TEMPLATE
  -- --------------------------------------------------------------------------
  insert into public.preparation_templates (
    id, slug, name, short_name, role_family, target_company, company_id, role_id, template_type, status, visibility, description
  )
  values (
    v_fullstack_template_id, 'fullstack-engineer', 'Full-Stack Engineer', 'Full-Stack', 'Full-Stack Engineer', null, null, 'full-stack-engineer', 'role', 'published', 'public',
    'Balanced end-to-end curriculum connecting client state, server boundaries, database schemas, and deployment pipelines.'
  )
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_name = excluded.short_name,
    company_id = excluded.company_id,
    role_id = excluded.role_id,
    template_type = excluded.template_type,
    description = excluded.description,
    status = excluded.status,
    visibility = excluded.visibility;

  insert into public.preparation_template_versions (
    template_id, version_number, status, change_summary, published_at
  )
  values (
    v_fullstack_template_id, 1, 'published', 'Initial Full-Stack Engineer curriculum bridging modern frontends and robust backend architectures.', now()
  )
  on conflict (template_id, version_number) do update set status = excluded.status
  returning id into v_fullstack_v1_id;

  update public.preparation_templates
  set current_published_version_id = v_fullstack_v1_id
  where id = v_fullstack_template_id;

  insert into public.template_version_tracks (template_version_id, track_id, priority, weight, sort_order)
  values
    (v_fullstack_v1_id, 'dsa', 'core', 25, 1),
    (v_fullstack_v1_id, 'projects', 'core', 25, 2),
    (v_fullstack_v1_id, 'databases-sql', 'high', 20, 3),
    (v_fullstack_v1_id, 'programming-language', 'high', 15, 4),
    (v_fullstack_v1_id, 'behavioral', 'medium', 15, 5)
  on conflict (template_version_id, track_id) do update set weight = excluded.weight;

end $$;
