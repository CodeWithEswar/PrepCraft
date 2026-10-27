-- Created with Supabase CLI, ordered after the repository's pre-existing 23:15 migration.
-- Today owns daily execution projections only. No revision/mastery/readiness/focus tables.
create schema if not exists private;

create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan_date date not null,
  timezone text not null,
  status text not null default 'active' check (status in ('active','rest')),
  planned_minutes integer not null default 0 check (planned_minutes between 0 and 10080),
  context_version text not null,
  policy_version text not null default 'today-priority-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,plan_date), unique(id,workspace_id)
);
create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  daily_plan_id uuid not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_type text not null check(source_type in ('custom','revision','practice','study','interview')),
  source_id uuid,
  task_type text not null check(task_type in ('dsa','revision','aptitude','language','fundamentals','projects','behavioral','interview','timed_practice','custom')),
  title text not null check(length(btrim(title)) between 1 and 160),
  notes text not null default '' check(length(notes)<=1000),
  estimated_minutes integer not null check(estimated_minutes between 5 and 480),
  required boolean not null default true,
  status text not null default 'planned' check(status in ('planned','in_progress','completed','skipped','deferred')),
  due_at timestamptz,
  sort_order integer not null default 0 check(sort_order>=0),
  version integer not null default 0 check(version>=0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(daily_plan_id,workspace_id) references public.daily_plans(id,workspace_id) on delete cascade,
  check ((status='completed')=(completed_at is not null)),
  check (completed_at is null or (started_at is not null and completed_at>=started_at)),
  check ((source_type='custom' and source_id is null) or (source_type<>'custom' and source_id is not null))
);
create index daily_tasks_plan_status on public.daily_tasks(daily_plan_id,status);
create index daily_tasks_workspace_status on public.daily_tasks(workspace_id,status);
create index daily_tasks_workspace_due on public.daily_tasks(workspace_id,due_at) where due_at is not null and status not in ('completed','deferred');
create unique index daily_tasks_source_once on public.daily_tasks(daily_plan_id,source_type,source_id) where source_id is not null and status<>'deferred';
create table public.today_activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  daily_plan_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check(event_type in ('daily_plan.created','daily_plan.rest','daily_plan.reviewed','daily_plan.completed','daily_task.created','daily_task.started','daily_task.completed','daily_task.deferred','daily_task.skipped')),
  task_id uuid references public.daily_tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key(daily_plan_id,workspace_id) references public.daily_plans(id,workspace_id) on delete cascade
);
create index today_events_workspace_date on public.today_activity_events(workspace_id,created_at desc);
create index today_events_plan on public.today_activity_events(daily_plan_id);
create index today_events_actor on public.today_activity_events(user_id);
create index today_events_task on public.today_activity_events(task_id) where task_id is not null;

alter table public.daily_plans enable row level security;
alter table public.daily_plans force row level security;
alter table public.daily_tasks enable row level security;
alter table public.daily_tasks force row level security;
alter table public.today_activity_events enable row level security;
alter table public.today_activity_events force row level security;
create policy today_plan_read on public.daily_plans for select to authenticated using(public.is_workspace_member(workspace_id));
create policy today_task_read on public.daily_tasks for select to authenticated using(public.is_workspace_member(workspace_id));
create policy today_event_read on public.today_activity_events for select to authenticated using(public.is_workspace_member(workspace_id));
revoke all on public.daily_plans,public.daily_tasks,public.today_activity_events from public,anon,authenticated;
grant select on public.daily_plans,public.daily_tasks,public.today_activity_events to authenticated;

-- The only writer: an internal, transaction-scoped API with explicit live authorization.
-- Direct Data API writes remain revoked, preventing source-domain completion bypasses.
create function private.mutate_today(p_slug text,p_day date,p_command jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  actor uuid := (select auth.uid());
  ws public.workspaces%rowtype;
  target public.workspace_targets%rowtype;
  prefs public.workspace_preferences%rowtype;
  curriculum public.workspace_curricula%rowtype;
  plan public.daily_plans%rowtype;
  task public.daily_tasks%rowtype;
  destination_plan public.daily_plans%rowtype;
  action text := p_command->>'kind';
  context_key text;
  event text;
  task_id uuid;
  destination date;
  estimate integer;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into ws from public.workspaces where slug=p_slug for share;
  if ws.id is null or ws.status<>'active' or not exists(select 1 from public.workspace_members m where m.workspace_id=ws.id and m.user_id=actor and m.status='active' and m.role in ('owner','admin','member')) then
    raise exception 'Workspace access unavailable' using errcode='42501';
  end if;
  if p_day<>(now() at time zone ws.timezone)::date then raise exception 'Day changed. Refresh Today.' using errcode='40001'; end if;
  if action is null or action not in ('add','create_plan','rest','study','review','start','complete','skip','defer') then raise exception 'Invalid command' using errcode='22023'; end if;
  select * into target from public.workspace_targets where workspace_id=ws.id;
  select * into prefs from public.workspace_preferences where workspace_id=ws.id;
  select * into curriculum from public.workspace_curricula where workspace_id=ws.id;
  context_key:=ws.timezone||'|'||coalesce(floor(extract(epoch from target.updated_at)*1000)::bigint::text,'0')||'|'||coalesce(floor(extract(epoch from prefs.updated_at)*1000)::bigint::text,'0')||'|'||coalesce(floor(extract(epoch from curriculum.updated_at)*1000)::bigint::text,'0');
  if action in ('add','create_plan') and curriculum.id is null and target.template_id is null then raise exception 'Choose a curriculum first' using errcode='22023'; end if;
  insert into public.daily_plans(workspace_id,plan_date,timezone,context_version) values(ws.id,p_day,ws.timezone,context_key) on conflict(workspace_id,plan_date) do nothing returning * into plan;
  if plan.id is not null then insert into public.today_activity_events(workspace_id,daily_plan_id,user_id,event_type) values(ws.id,plan.id,actor,'daily_plan.created'); end if;
  select * into plan from public.daily_plans where workspace_id=ws.id and plan_date=p_day for update;
  if plan.timezone<>ws.timezone then raise exception 'Timezone changed. Review the plan in settings.' using errcode='40001'; end if;
  if action='review' then
    update public.daily_plans set context_version=context_key,updated_at=now() where id=plan.id;
    event:='daily_plan.reviewed';
  elsif action in ('rest','study') then
    if action='rest' and exists(select 1 from public.daily_tasks where daily_plan_id=plan.id and required and status not in ('completed','deferred')) then raise exception 'Reschedule or finish required tasks before taking a rest day' using errcode='22023'; end if;
    update public.daily_plans set status=case when action='rest' then 'rest' else 'active' end,updated_at=now() where id=plan.id;
    event:=case when action='rest' then 'daily_plan.rest' else 'daily_plan.reviewed' end;
  elsif action='add' then
    if plan.status='rest' then raise exception 'Change to a preparation day before adding tasks' using errcode='22023'; end if;
    if plan.context_version<>context_key then raise exception 'Review your changed preparation context first' using errcode='40001'; end if;
    estimate:=(p_command->>'minutes')::integer;
    task_id:=(p_command->>'taskId')::uuid;
    if task_id is null or estimate is null or estimate not between 5 and 480 or length(btrim(coalesce(p_command->>'title',''))) not between 1 and 160 or length(coalesce(p_command->>'notes',''))>1000 or p_command->>'type' is null or p_command->>'type' not in ('dsa','revision','aptitude','language','fundamentals','projects','behavioral','interview','timed_practice','custom') then raise exception 'Invalid task' using errcode='22023'; end if;
    select * into task from public.daily_tasks where id=task_id;
    if task.id is not null then
      if task.workspace_id=ws.id and task.daily_plan_id=plan.id and task.title=btrim(p_command->>'title') then return plan.id; else raise exception 'Task identifier conflict' using errcode='40001'; end if;
    end if;
    if (select count(*) from public.daily_tasks where daily_plan_id=plan.id)>=100 or plan.planned_minutes+estimate>10080 then raise exception 'Daily plan limit reached' using errcode='22023'; end if;
    insert into public.daily_tasks(id,daily_plan_id,workspace_id,source_type,task_type,title,notes,estimated_minutes,required,sort_order)
      values(task_id,plan.id,ws.id,'custom',p_command->>'type',btrim(p_command->>'title'),coalesce(p_command->>'notes',''),estimate,coalesce((p_command->>'required')::boolean,true),(select count(*) from public.daily_tasks where daily_plan_id=plan.id));
    update public.daily_plans set planned_minutes=planned_minutes+estimate,updated_at=now() where id=plan.id;
    event:='daily_task.created';
  elsif action in ('start','complete','skip','defer') then
    select * into task from public.daily_tasks where id=(p_command->>'taskId')::uuid and workspace_id=ws.id for update;
    if task.id is null then raise exception 'Task unavailable' using errcode='42501'; end if;
    if action='complete' and task.status='completed' then return plan.id; end if;
    if (p_command->>'version')::integer is distinct from task.version then raise exception 'Task changed. Refresh and try again.' using errcode='40001'; end if;
    if task.status not in ('planned','in_progress','skipped') then raise exception 'Task cannot be changed in this state' using errcode='22023'; end if;
    if action in ('start','complete') and task.source_type<>'custom' then raise exception 'Complete this task in its source feature' using errcode='22023'; end if;
    if action in ('start','complete') and task.daily_plan_id<>plan.id then raise exception 'Move this task to today before starting' using errcode='22023'; end if;
    if action='defer' then
      destination:=(p_command->>'destination')::date;
      if destination is null or destination<p_day or destination>p_day+365 or (destination=p_day and task.daily_plan_id=plan.id) then raise exception 'Choose a different day within the coming year' using errcode='22023'; end if;
      insert into public.daily_plans(workspace_id,plan_date,timezone,context_version) values(ws.id,destination,ws.timezone,context_key) on conflict(workspace_id,plan_date) do nothing;
      select * into destination_plan from public.daily_plans where workspace_id=ws.id and plan_date=destination for update;
      if destination_plan.status='rest' or destination_plan.planned_minutes+task.estimated_minutes>10080 then raise exception 'Destination plan cannot accept this task' using errcode='22023'; end if;
      insert into public.daily_tasks(daily_plan_id,workspace_id,source_type,source_id,task_type,title,notes,estimated_minutes,required,due_at,sort_order)
        values(destination_plan.id,ws.id,task.source_type,task.source_id,task.task_type,task.title,task.notes,task.estimated_minutes,task.required,task.due_at,(select count(*) from public.daily_tasks where daily_plan_id=destination_plan.id));
      update public.daily_plans set planned_minutes=planned_minutes+task.estimated_minutes,updated_at=now() where id=destination_plan.id;
    end if;
    update public.daily_tasks set status=case action when 'start' then 'in_progress' when 'complete' then 'completed' when 'skip' then 'skipped' else 'deferred' end,
      started_at=case when action in ('start','complete') then coalesce(started_at,now()) else started_at end,
      completed_at=case when action='complete' then now() else null end,version=version+1,updated_at=now() where id=task.id;
    event:=case action when 'start' then 'daily_task.started' when 'complete' then 'daily_task.completed' when 'skip' then 'daily_task.skipped' else 'daily_task.deferred' end;
    task_id:=task.id;
    if action='complete' and exists(select 1 from public.daily_tasks where daily_plan_id=plan.id and required) and not exists(select 1 from public.daily_tasks where daily_plan_id=plan.id and required and status not in ('completed','deferred')) then
      insert into public.today_activity_events(workspace_id,daily_plan_id,user_id,event_type) values(ws.id,plan.id,actor,'daily_plan.completed');
    end if;
  end if;
  if event is not null then insert into public.today_activity_events(workspace_id,daily_plan_id,user_id,event_type,task_id) values(ws.id,case when task.id is not null then task.daily_plan_id else plan.id end,actor,event,task_id); end if;
  return plan.id;
end;
$$;
revoke all on function private.mutate_today(text,date,jsonb) from public,anon,authenticated,service_role;
grant usage on schema private to authenticated;
grant execute on function private.mutate_today(text,date,jsonb) to authenticated;
create function public.mutate_today(p_slug text,p_day date,p_command jsonb) returns uuid
language sql security invoker set search_path='' as $$select private.mutate_today(p_slug,p_day,p_command);$$;
revoke all on function public.mutate_today(text,date,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.mutate_today(text,date,jsonb) to authenticated;
