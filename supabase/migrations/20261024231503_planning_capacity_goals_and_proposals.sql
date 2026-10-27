-- Created by Supabase CLI; ordered after the existing Today migration chain.
-- Planning owns construction; Today executes the SAME daily_plans/daily_tasks rows.
alter table public.daily_plans add column lifecycle text not null default 'active' check(lifecycle in ('active','closed'));
alter table public.daily_tasks drop constraint daily_tasks_status_check;
alter table public.daily_tasks add constraint daily_tasks_status_check check(status in ('planned','in_progress','completed','skipped','deferred','cancelled'));
alter table public.daily_tasks add constraint daily_tasks_id_workspace_key unique(id,workspace_id);
alter table public.daily_tasks
  add column track_id text references public.tracks(id) on delete restrict,
  add column topic_id text references public.topics(id) on delete restrict,
  add column target_count integer check(target_count between 1 and 10080),
  add column target_unit text check(target_unit in ('minutes','count','sessions','topics','questions')),
  add column scheduled_start timestamptz,
  add column scheduled_end timestamptz,
  add column carryover_from_task_id uuid,
  add column carryover_count integer not null default 0 check(carryover_count between 0 and 1000),
  add column generation_key text check(length(generation_key)<=200),
  add constraint daily_tasks_lineage_workspace_fk foreign key(carryover_from_task_id,workspace_id) references public.daily_tasks(id,workspace_id) on delete restrict,
  add constraint daily_tasks_window_check check((scheduled_start is null and scheduled_end is null) or (scheduled_start is not null and scheduled_end is not null and scheduled_end>scheduled_start)),
  add constraint daily_tasks_count_check check((target_count is null)=(target_unit is null));
-- Composite identity supports tenant-safe lineage.
create index daily_tasks_carryover on public.daily_tasks(carryover_from_task_id,workspace_id) where carryover_from_task_id is not null;
create index daily_tasks_track on public.daily_tasks(track_id) where track_id is not null;
create index daily_tasks_topic on public.daily_tasks(topic_id) where topic_id is not null;
create unique index daily_tasks_generation_once on public.daily_tasks(workspace_id,generation_key) where generation_key is not null and status not in ('cancelled','deferred');

create table public.planning_state (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  revision bigint not null default 0 check(revision>=0)
);
create table public.weekly_goals (
  id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,
  week_start date not null check(extract(isodow from week_start)=1),created_at timestamptz not null default now(),
  unique(workspace_id,week_start),unique(id,workspace_id)
);
create table public.weekly_goal_items (
  id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,
  weekly_goal_id uuid not null,title text not null check(length(btrim(title)) between 1 and 160),
  goal_type text not null check(goal_type in ('study_time','question_count','revision_count','topic_completion','practice_session','behavioral_story','custom')),
  unit text not null check(unit in ('minutes','count','sessions','topics','questions')),
  target integer not null check(target between 1 and 10080),track_id text references public.tracks(id) on delete restrict,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  foreign key(weekly_goal_id,workspace_id) references public.weekly_goals(id,workspace_id) on delete cascade,
  check((goal_type='study_time' and unit='minutes') or (goal_type='question_count' and unit='questions') or (goal_type='topic_completion' and unit='topics') or (goal_type='practice_session' and unit='sessions') or (goal_type in ('revision_count','behavioral_story','custom') and unit='count'))
);
create index weekly_goal_items_container on public.weekly_goal_items(weekly_goal_id,workspace_id);
create index weekly_goal_items_track on public.weekly_goal_items(track_id) where track_id is not null;
create index weekly_goal_items_workspace on public.weekly_goal_items(workspace_id);
create table public.planning_availability (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,weekday integer not null check(weekday between 0 and 6),
  minutes integer not null check(minutes between 0 and 720),rest boolean not null default false,start_time time,end_time time,
  primary key(workspace_id,weekday),check((rest and minutes=0) or (not rest and minutes>=5)),
  check((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time>start_time and extract(epoch from end_time-start_time)/60>=minutes))
);
create table public.planning_availability_overrides (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,plan_date date not null,
  minutes integer not null check(minutes between 0 and 720),rest boolean not null default false,start_time time,end_time time,
  primary key(workspace_id,plan_date),check((rest and minutes=0) or (not rest and minutes>=5)),
  check((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time>start_time and extract(epoch from end_time-start_time)/60>=minutes))
);
create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,
  week_start date not null check(extract(isodow from week_start)=1),notes text not null default '' check(length(notes)<=4000),
  summary jsonb not null check(jsonb_typeof(summary)='object' and octet_length(summary::text)<32000),
  closed_by uuid not null references auth.users(id) on delete restrict,closed_at timestamptz not null default now(),unique(workspace_id,week_start)
);
create index weekly_reviews_actor on public.weekly_reviews(closed_by);
create table public.planning_activity_events (
  id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,request_id uuid not null,request_hash text not null,
  week_start date not null,event_type text not null check(event_type in ('add','edit','move','reorder','cancel','carry','availability','goal','delete_goal','apply','close')),
  policy_version text not null default 'capacity-v1',changes jsonb not null default '{}'::jsonb check(octet_length(changes::text)<120000),created_at timestamptz not null default now(),unique(workspace_id,request_id)
);
create index planning_events_actor on public.planning_activity_events(actor_id);
create index planning_events_week on public.planning_activity_events(workspace_id,week_start,created_at desc);

do $$ declare t text;begin
  foreach t in array array['planning_state','weekly_goals','weekly_goal_items','planning_availability','planning_availability_overrides','weekly_reviews','planning_activity_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('alter table public.%I force row level security',t);
    execute format('create policy planning_member_read on public.%I for select to authenticated using(public.is_workspace_member(workspace_id))',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
end $$;

create function private.bump_planning_revision() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.workspaces where id=coalesce(new.workspace_id,old.workspace_id)) then return coalesce(new,old);end if;
  insert into public.planning_state(workspace_id,revision) values(coalesce(new.workspace_id,old.workspace_id),1)
    on conflict(workspace_id) do update set revision=planning_state.revision+1;
  return coalesce(new,old);
end $$;
revoke all on function private.bump_planning_revision() from public,anon,authenticated;
do $$ declare t text;begin
  foreach t in array array['daily_plans','daily_tasks','weekly_goals','weekly_goal_items','planning_availability','planning_availability_overrides','weekly_reviews','workspace_targets','workspace_preferences','workspace_curricula','workspace_curriculum_overrides'] loop
    execute format('create trigger planning_revision_changed after insert or update or delete on public.%I for each row execute function private.bump_planning_revision()',t);
  end loop;
end $$;

create function private.planning_context(p_workspace uuid) returns text language sql stable security definer set search_path='' as $$
  select w.timezone||'|'||coalesce(floor(extract(epoch from t.updated_at)*1000)::bigint::text,'0')||'|'||coalesce(floor(extract(epoch from p.updated_at)*1000)::bigint::text,'0')||'|'||coalesce(floor(extract(epoch from c.updated_at)*1000)::bigint::text,'0')
  from public.workspaces w left join public.workspace_targets t on t.workspace_id=w.id left join public.workspace_preferences p on p.workspace_id=w.id left join public.workspace_curricula c on c.workspace_id=w.id where w.id=p_workspace
$$;
revoke all on function private.planning_context(uuid) from public,anon,authenticated;
create or replace function private.planning_capacity(p_workspace uuid,p_day date) returns integer language sql stable security definer set search_path='' as $$
  select case
    when exists(select 1 from public.daily_plans where workspace_id=p_workspace and plan_date=p_day and status='rest') then 0
    else coalesce(
      (select case when rest then 0 else minutes end from public.planning_availability_overrides where workspace_id=p_workspace and plan_date=p_day),
      (select case when rest then 0 else minutes end from public.planning_availability where workspace_id=p_workspace and weekday=extract(dow from p_day)::integer),
      (select case
        when exists(select 1 from public.daily_plans where workspace_id=p_workspace and plan_date=p_day and status='active') then greatest(coalesce(default_daily_minutes, 120), 30)
        when (array['sunday','monday','tuesday','wednesday','thursday','friday','saturday'])[extract(dow from p_day)::integer + 1] = any(coalesce(study_days, array[]::text[])) then greatest(coalesce(default_daily_minutes, 120), 30)
        else 0
      end from public.workspace_preferences where workspace_id=p_workspace),
      120
    )
  end
$$;
revoke all on function private.planning_capacity(uuid,date) from public,anon,authenticated;
create function private.planning_day(p_workspace uuid,p_day date,p_timezone text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  if exists(select 1 from public.weekly_reviews where workspace_id=p_workspace and week_start=date_trunc('week',p_day)::date) then raise exception 'This week is closed and read-only' using errcode='22023';end if;
  insert into public.daily_plans(workspace_id,plan_date,timezone,context_version,policy_version) values(p_workspace,p_day,p_timezone,private.planning_context(p_workspace),'capacity-v1') on conflict(workspace_id,plan_date) do nothing;
  select id into result from public.daily_plans where workspace_id=p_workspace and plan_date=p_day and timezone=p_timezone and lifecycle='active';
  if result is null then raise exception 'Review the changed timezone in Today before editing this plan' using errcode='40001';end if;
  return result;
end $$;
revoke all on function private.planning_day(uuid,date,text) from public,anon,authenticated;

create function private.mutate_planning(p_slug text,p_week date,p_revision bigint,p_request uuid,p_context text,p_command jsonb) returns bigint
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=(select auth.uid());ws public.workspaces%rowtype;today date;action text:=p_command->>'kind';current_revision bigint;prior public.planning_activity_events%rowtype;
  task public.daily_tasks%rowtype;destination uuid;source_day date;day date;goal_container uuid;goal_id uuid;item jsonb;ids uuid[];entry_count integer;window_start timestamptz;window_end timestamptz;
  request_hash text:=md5(p_week::text||coalesce(p_command::text,''));closed_summary jsonb;affected_dates date[]:=array[]::date[];plan_id uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501';end if;
  select * into ws from public.workspaces where slug=p_slug for update;
  if ws.id is null or ws.status<>'active' or not exists(select 1 from public.workspace_members where workspace_id=ws.id and user_id=actor and status='active' and role in ('owner','admin','member') for share) then raise exception 'Workspace access unavailable' using errcode='42501';end if;
  today:=(now() at time zone ws.timezone)::date;
  if p_week is null or extract(isodow from p_week)<>1 or p_week<today-730 or p_week>today+365 or p_request is null or p_command is null or octet_length(p_command::text)>120000 or action not in ('add','edit','move','reorder','cancel','carry','availability','goal','delete_goal','apply','close') or action is null then raise exception 'Invalid planning request' using errcode='22023';end if;
  select * into prior from public.planning_activity_events where workspace_id=ws.id and request_id=p_request;
  if prior.id is not null then
    if prior.request_hash<>request_hash or prior.actor_id<>actor then raise exception 'Request identifier conflict' using errcode='40001';end if;
    return coalesce((select revision from public.planning_state where workspace_id=ws.id),0);
  end if;
  insert into public.planning_state(workspace_id) values(ws.id) on conflict do nothing;
  select revision into current_revision from public.planning_state where workspace_id=ws.id for update;
  if current_revision is distinct from p_revision or private.planning_context(ws.id) is distinct from p_context then raise exception 'The planning context changed. Refresh and review again.' using errcode='40001';end if;
  if exists(select 1 from public.weekly_reviews where workspace_id=ws.id and week_start=p_week) then raise exception 'This week is closed and read-only' using errcode='22023';end if;
  if action in ('edit','move','cancel','carry') then
    select * into task from public.daily_tasks where id=(p_command->>'taskId')::uuid and workspace_id=ws.id for update;
    if task.id is null then raise exception 'Task unavailable' using errcode='42501';end if;
    select plan_date into source_day from public.daily_plans where id=task.daily_plan_id and workspace_id=ws.id;
    if task.version is distinct from (p_command->>'version')::integer then raise exception 'Task changed. Refresh the plan.' using errcode='40001';end if;
    if task.status not in ('planned','skipped') and not (action='carry' and task.status='in_progress') then raise exception 'Only unfinished, inactive tasks can be planned. Continue active work in Today.' using errcode='22023';end if;
    if exists(select 1 from public.weekly_reviews where workspace_id=ws.id and week_start=date_trunc('week',source_day)::date) then raise exception 'The source week is closed' using errcode='22023';end if;
    if action in ('edit','move') and source_day<today then raise exception 'Use an explicit carryover decision for earlier work' using errcode='22023';end if;
    if action<>'carry' and date_trunc('week',source_day)::date<>p_week then raise exception 'Choose the task in its own week' using errcode='22023';end if;
    affected_dates:=array_append(affected_dates,source_day);
  end if;
  if action in ('add','move','carry') then
    day:=(p_command->>'day')::date;
    if day is null or day<today or day>today+365 or day<p_week or day>p_week+6 then raise exception 'Choose a current or future day in the selected week' using errcode='22023';end if;
    destination:=private.planning_day(ws.id,day,ws.timezone);affected_dates:=array_append(affected_dates,day);
    if private.planning_capacity(ws.id,day)=0 then raise exception 'This is a rest day. Update availability first.' using errcode='22023';end if;
    if (select count(*) from public.daily_tasks where daily_plan_id=destination)>=100 then raise exception 'Daily task limit reached' using errcode='22023';end if;
  end if;
  if action='add' then
    insert into public.daily_tasks(daily_plan_id,workspace_id,source_type,task_type,title,notes,estimated_minutes,required,sort_order,scheduled_start,scheduled_end)
      values(destination,ws.id,'custom',p_command->>'type',btrim(p_command->>'title'),coalesce(p_command->>'notes',''),(p_command->>'minutes')::integer,coalesce((p_command->>'required')::boolean,true),(select count(*) from public.daily_tasks where daily_plan_id=destination),(p_command->>'scheduledStart')::timestamptz,(p_command->>'scheduledEnd')::timestamptz);
  elsif action='edit' then
    if task.source_type<>'custom' then raise exception 'Source work must be edited in its source feature' using errcode='22023';end if;
    update public.daily_tasks set title=btrim(p_command->>'title'),notes=coalesce(p_command->>'notes',''),estimated_minutes=(p_command->>'minutes')::integer,required=(p_command->>'required')::boolean,scheduled_start=(p_command->>'scheduledStart')::timestamptz,scheduled_end=(p_command->>'scheduledEnd')::timestamptz,version=version+1,updated_at=now() where id=task.id;
  elsif action='move' then
    if task.source_type<>'custom' or task.scheduled_start is not null or task.due_at is not null then raise exception 'Fixed and source obligations are protected. Review them explicitly.' using errcode='22023';end if;
    update public.daily_tasks set daily_plan_id=destination,sort_order=(select count(*) from public.daily_tasks where daily_plan_id=destination),version=version+1,updated_at=now() where id=task.id;
  elsif action='carry' then
    if source_day>=today or day<=source_day then raise exception 'Carryover is for earlier unfinished work' using errcode='22023';end if;
    -- Change the old projection before inserting so the source/generation uniqueness stays intact.
    update public.daily_tasks set status='deferred',version=version+1,updated_at=now() where id=task.id;
    insert into public.daily_tasks(daily_plan_id,workspace_id,source_type,source_id,task_type,title,notes,estimated_minutes,required,due_at,sort_order,track_id,topic_id,target_count,target_unit,carryover_from_task_id,carryover_count,generation_key)
      values(destination,ws.id,task.source_type,task.source_id,task.task_type,task.title,task.notes,task.estimated_minutes,task.required,task.due_at,(select count(*) from public.daily_tasks where daily_plan_id=destination),task.track_id,task.topic_id,task.target_count,task.target_unit,task.id,task.carryover_count+1,task.generation_key);
  elsif action='cancel' then
    update public.daily_tasks set status='cancelled',version=version+1,updated_at=now() where id=task.id;
  elsif action='reorder' then
    day:=(p_command->>'day')::date;
    if day<today or day<p_week or day>p_week+6 then raise exception 'Historical order is read-only' using errcode='22023';end if;
    select id into plan_id from public.daily_plans where workspace_id=ws.id and plan_date=day;
    select array_agg(value::uuid) into ids from jsonb_array_elements_text(p_command->'taskIds');
    if cardinality(ids) is distinct from (select count(*)::int from public.daily_tasks where daily_plan_id=plan_id and status not in ('deferred','cancelled')) or cardinality(ids) is distinct from (select count(distinct v)::int from unnest(ids) v) or exists(select 1 from unnest(ids) v where not exists(select 1 from public.daily_tasks where id=v and workspace_id=ws.id and daily_plan_id=plan_id and status not in ('deferred','cancelled'))) then raise exception 'The complete current task order is required' using errcode='40001';end if;
    update public.daily_tasks set sort_order=array_position(ids,id)-1,version=version+1,updated_at=now() where id=any(ids) and workspace_id=ws.id;
  elsif action='availability' then
    if jsonb_array_length(p_command->'rules')>7 then raise exception 'Invalid weekday rules' using errcode='22023';end if;
    if jsonb_array_length(p_command->'rules')<>(select count(distinct value->>'weekday') from jsonb_array_elements(p_command->'rules')) then raise exception 'Duplicate weekday rules' using errcode='22023';end if;
    for item in select * from jsonb_array_elements(p_command->'rules') loop
      insert into public.planning_availability(workspace_id,weekday,minutes,rest,start_time,end_time) values(ws.id,(item->>'weekday')::integer,(item->>'minutes')::integer,(item->>'rest')::boolean,(item->>'start')::time,(item->>'end')::time)
      on conflict(workspace_id,weekday) do update set minutes=excluded.minutes,rest=excluded.rest,start_time=excluded.start_time,end_time=excluded.end_time;
    end loop;
    if p_command->'override' is not null then
      item:=p_command->'override';day:=(item->>'day')::date;
      if day<today or day>today+365 then raise exception 'Availability overrides are for current and future dates' using errcode='22023';end if;
      insert into public.planning_availability_overrides(workspace_id,plan_date,minutes,rest,start_time,end_time) values(ws.id,day,(item->>'minutes')::integer,(item->>'rest')::boolean,(item->>'start')::time,(item->>'end')::time)
      on conflict(workspace_id,plan_date) do update set minutes=excluded.minutes,rest=excluded.rest,start_time=excluded.start_time,end_time=excluded.end_time;
    end if;
  elsif action='goal' then
    insert into public.weekly_goals(workspace_id,week_start) values(ws.id,p_week) on conflict(workspace_id,week_start) do nothing;
    select id into goal_container from public.weekly_goals where workspace_id=ws.id and week_start=p_week;
    if p_command->>'goalId' is null then
      if (select count(*) from public.weekly_goal_items where weekly_goal_id=goal_container)>=20 then raise exception 'Weekly goal limit reached' using errcode='22023';end if;
      insert into public.weekly_goal_items(workspace_id,weekly_goal_id,title,goal_type,unit,target,track_id) values(ws.id,goal_container,btrim(p_command->>'title'),p_command->>'goalKind',p_command->>'unit',(p_command->>'target')::int,p_command->>'trackId');
    else
      update public.weekly_goal_items set title=btrim(p_command->>'title'),goal_type=p_command->>'goalKind',unit=p_command->>'unit',target=(p_command->>'target')::int,track_id=p_command->>'trackId',updated_at=now() where id=(p_command->>'goalId')::uuid and workspace_id=ws.id and weekly_goal_id=goal_container returning id into goal_id;
      if goal_id is null then raise exception 'Goal unavailable' using errcode='42501';end if;
    end if;
  elsif action='delete_goal' then
    delete from public.weekly_goal_items where id=(p_command->>'goalId')::uuid and workspace_id=ws.id and weekly_goal_id in (select id from public.weekly_goals where workspace_id=ws.id and week_start=p_week) returning id into goal_id;
    if goal_id is null then raise exception 'Goal unavailable' using errcode='42501';end if;
  elsif action='apply' then
    if p_command->>'policy' is distinct from 'capacity-v1' or jsonb_typeof(p_command->'items') is distinct from 'array' or jsonb_array_length(p_command->'items')>100 then raise exception 'Invalid planning proposal' using errcode='22023';end if;
    for item in select * from jsonb_array_elements(p_command->'items') loop
      day:=(item->>'day')::date;
      if day<today or day<p_week or day>p_week+6 then raise exception 'Proposal contains a historical or out-of-week day' using errcode='22023';end if;
      destination:=private.planning_day(ws.id,day,ws.timezone);affected_dates:=array_append(affected_dates,day);
      if item->>'existingId' is not null then
        select * into task from public.daily_tasks where id=(item->>'existingId')::uuid and workspace_id=ws.id for update;
        select plan_date into source_day from public.daily_plans where id=task.daily_plan_id;
        if task.id is null or task.status<>'planned' or task.source_type<>'custom' or task.due_at is not null or task.scheduled_start is not null or source_day<today or source_day<p_week or source_day>p_week+6 then raise exception 'Protected work cannot be rebalanced' using errcode='40001';end if;
        affected_dates:=array_append(affected_dates,source_day);
        update public.daily_tasks set daily_plan_id=destination,sort_order=(select count(*) from public.daily_tasks where daily_plan_id=destination),version=version+1,updated_at=now() where id=task.id;
      else
        insert into public.daily_tasks(daily_plan_id,workspace_id,source_type,task_type,title,notes,estimated_minutes,required,sort_order,track_id,topic_id,target_count,target_unit,generation_key)
          values(destination,ws.id,'custom',item->>'type',item->>'title',coalesce(item->>'notes',''),(item->>'minutes')::int,(item->>'required')::boolean,(select count(*) from public.daily_tasks where daily_plan_id=destination),item->>'trackId',item->>'topicId',(item->>'targetCount')::int,item->>'targetUnit',item->>'generationKey');
      end if;
    end loop;
  elsif action='close' then
    if p_week+6>=today then raise exception 'Review and close this week after its final day' using errcode='22023';end if;
    if exists(select 1 from public.daily_tasks t join public.daily_plans p on p.id=t.daily_plan_id where p.workspace_id=ws.id and p.plan_date between p_week and p_week+6 and t.required and t.status in ('planned','in_progress','skipped')) then raise exception 'Decide what to do with unfinished required work before closing the week' using errcode='22023';end if;
    select jsonb_build_object('plannedMinutes',coalesce(sum(t.estimated_minutes) filter(where t.status not in ('deferred','cancelled')),0),'completedTasks',count(t.id) filter(where t.status='completed'),'totalTasks',count(t.id) filter(where t.status not in ('deferred','cancelled')),'focusedMinutes',null,'carryoverCount',count(t.id) filter(where t.status='deferred'),'observations',jsonb_build_array('Closed from recorded schedule outcomes. Focused time is unavailable.')) into closed_summary
      from public.daily_plans p left join public.daily_tasks t on t.daily_plan_id=p.id where p.workspace_id=ws.id and p.plan_date between p_week and p_week+6;
    insert into public.weekly_reviews(workspace_id,week_start,notes,summary,closed_by) values(ws.id,p_week,coalesce(p_command->>'notes',''),closed_summary,actor);
    update public.daily_plans set lifecycle='closed',updated_at=now() where workspace_id=ws.id and plan_date between p_week and p_week+6;
  end if;
  -- Validate the FINAL transaction, so multi-task rebalances can swap occupied days.
  if action in ('add','edit','move','carry','apply') then
    foreach day in array affected_dates loop
      if day>=today then
        if (select coalesce(sum(t.estimated_minutes),0) from public.daily_tasks t join public.daily_plans p on p.id=t.daily_plan_id where p.workspace_id=ws.id and p.plan_date=day and t.status not in ('deferred','cancelled','skipped'))>private.planning_capacity(ws.id,day) then raise exception 'This change exceeds the available capacity. Adjust the plan or availability.' using errcode='22023';end if;
        if (select count(*) from public.daily_tasks t join public.daily_plans p on p.id=t.daily_plan_id where p.workspace_id=ws.id and p.plan_date=day)>100 then raise exception 'Daily task limit reached' using errcode='22023';end if;
        for task in select t.* from public.daily_tasks t join public.daily_plans p on p.id=t.daily_plan_id where p.workspace_id=ws.id and p.plan_date=day and t.status not in ('deferred','cancelled','skipped') and t.scheduled_start is not null loop
          if (task.scheduled_start at time zone ws.timezone)::date<>day or (task.scheduled_end at time zone ws.timezone)::date<>day or extract(epoch from task.scheduled_end-task.scheduled_start)/60<task.estimated_minutes then raise exception 'Scheduled window must fit the task on its local date' using errcode='22023';end if;
          if exists(select 1 from public.daily_tasks other where other.daily_plan_id=task.daily_plan_id and other.id<>task.id and other.status not in ('deferred','cancelled','skipped') and other.scheduled_start<task.scheduled_end and other.scheduled_end>task.scheduled_start) then raise exception 'Scheduled tasks overlap' using errcode='22023';end if;
          -- Availability wall-clock bounds are checked below using time values directly.
          if exists(select 1 from (select start_time,end_time,0 rank from public.planning_availability_overrides where workspace_id=ws.id and plan_date=day union all select start_time,end_time,1 from public.planning_availability where workspace_id=ws.id and weekday=extract(dow from day)) a where a.rank=(select min(b.rank) from (select 0 rank from public.planning_availability_overrides where workspace_id=ws.id and plan_date=day union all select 1 from public.planning_availability where workspace_id=ws.id and weekday=extract(dow from day)) b) and a.start_time is not null and ((task.scheduled_start at time zone ws.timezone)::time<a.start_time or (task.scheduled_end at time zone ws.timezone)::time>a.end_time)) then raise exception 'Scheduled task is outside the available window' using errcode='22023';end if;
        end loop;
      end if;
    end loop;
  end if;
  update public.daily_plans p set planned_minutes=(select coalesce(sum(estimated_minutes),0) from public.daily_tasks where daily_plan_id=p.id and status not in ('deferred','cancelled')),updated_at=now() where p.workspace_id=ws.id and p.plan_date=any(affected_dates);
  insert into public.planning_activity_events(workspace_id,actor_id,request_id,request_hash,week_start,event_type,changes) values(ws.id,actor,p_request,request_hash,p_week,action,p_command);
  return (select revision from public.planning_state where workspace_id=ws.id);
end $$;
revoke all on function private.mutate_planning(text,date,bigint,uuid,text,jsonb) from public,anon,service_role;
grant execute on function private.mutate_planning(text,date,bigint,uuid,text,jsonb) to authenticated;
create function public.mutate_planning(p_slug text,p_week date,p_revision bigint,p_request uuid,p_context text,p_command jsonb) returns bigint
language sql security invoker set search_path='' as $$select private.mutate_planning(p_slug,p_week,p_revision,p_request,p_context,p_command)$$;
revoke all on function public.mutate_planning(text,date,bigint,uuid,text,jsonb) from public,anon,service_role;
grant execute on function public.mutate_planning(text,date,bigint,uuid,text,jsonb) to authenticated;

create function private.guard_closed_planning_task() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.daily_plans p where p.id=coalesce(old.daily_plan_id,new.daily_plan_id) and (p.lifecycle='closed' or exists(select 1 from public.weekly_reviews r where r.workspace_id=p.workspace_id and r.week_start=date_trunc('week',p.plan_date)::date))) or
    (tg_op<>'DELETE' and exists(select 1 from public.daily_plans p where p.id=new.daily_plan_id and p.lifecycle='closed')) then
    raise exception 'Closed planning history is read-only' using errcode='22023';
  end if;
  return coalesce(new,old);
end $$;
revoke all on function private.guard_closed_planning_task() from public,anon,authenticated;
create trigger protect_closed_planning_history before insert or update or delete on public.daily_tasks for each row execute function private.guard_closed_planning_task();

-- Preserve Planning lineage and capacity in the Today execution transaction.
create or replace function private.mutate_today(p_slug text,p_day date,p_command jsonb) returns uuid
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
  perform 1 from public.workspace_members m where m.workspace_id=ws.id and m.user_id=actor and m.status='active' and m.role in ('owner','admin','member') for share;
  if ws.id is null or ws.status<>'active' or not found then
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
  if plan.timezone<>ws.timezone and action<>'review' then raise exception 'Timezone changed. Review the plan in settings.' using errcode='40001'; end if;
  if action='review' then
    update public.daily_plans set context_version=context_key,timezone=ws.timezone,updated_at=now() where id=plan.id;
    event:='daily_plan.reviewed';
  elsif action in ('rest','study') then
    if action='rest' and exists(select 1 from public.daily_tasks where daily_plan_id=plan.id and required and status not in ('completed','deferred','cancelled')) then raise exception 'Reschedule or finish required tasks before taking a rest day' using errcode='22023'; end if;
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
    if (select coalesce(sum(estimated_minutes),0) from public.daily_tasks where daily_plan_id=plan.id and status not in ('deferred','cancelled','skipped'))+estimate>private.planning_capacity(ws.id,p_day) then raise exception 'This task exceeds the available capacity. Adjust your plan or availability.' using errcode='22023';end if;
    insert into public.daily_tasks(id,daily_plan_id,workspace_id,source_type,task_type,title,notes,estimated_minutes,required,sort_order)
      values(task_id,plan.id,ws.id,'custom',p_command->>'type',btrim(p_command->>'title'),coalesce(p_command->>'notes',''),estimate,coalesce((p_command->>'required')::boolean,true),(select count(*) from public.daily_tasks where daily_plan_id=plan.id));
    update public.daily_plans set planned_minutes=planned_minutes+estimate,updated_at=now() where id=plan.id;
    event:='daily_task.created';
  elsif action in ('start','complete','skip','defer') then
    select * into task from public.daily_tasks where id=(p_command->>'taskId')::uuid and workspace_id=ws.id for update;
    if task.id is null then raise exception 'Task unavailable' using errcode='42501'; end if;
    if action='complete' and task.status='completed' then return plan.id; end if;
    if action='start' and task.status='in_progress' then return plan.id; end if;
    if (p_command->>'version')::integer is distinct from task.version then raise exception 'Task changed. Refresh and try again.' using errcode='40001'; end if;
    if task.status not in ('planned','in_progress','skipped') then raise exception 'Task cannot be changed in this state' using errcode='22023'; end if;
    if action in ('start','complete') and task.source_type<>'custom' then raise exception 'Complete this task in its source feature' using errcode='22023'; end if;
    if action in ('start','complete') and task.daily_plan_id<>plan.id then raise exception 'Move this task to today before starting' using errcode='22023'; end if;
    if action='defer' then
      destination:=(p_command->>'destination')::date;
      if destination is null or destination<p_day or destination>p_day+365 or (destination=p_day and task.daily_plan_id=plan.id) then raise exception 'Choose a different day within the coming year' using errcode='22023'; end if;
      insert into public.daily_plans(workspace_id,plan_date,timezone,context_version) values(ws.id,destination,ws.timezone,context_key) on conflict(workspace_id,plan_date) do nothing;
      select * into destination_plan from public.daily_plans where workspace_id=ws.id and plan_date=destination for update;
      if destination_plan.status='rest' or destination_plan.planned_minutes+task.estimated_minutes>10080 or (select count(*) from public.daily_tasks where daily_plan_id=destination_plan.id)>=100 then raise exception 'Destination plan cannot accept this task' using errcode='22023'; end if;
      if (select coalesce(sum(estimated_minutes),0) from public.daily_tasks where daily_plan_id=destination_plan.id and status not in ('deferred','cancelled','skipped'))+task.estimated_minutes>private.planning_capacity(ws.id,destination) then raise exception 'The destination does not have enough available capacity.' using errcode='22023';end if;
      update public.daily_tasks set status='deferred' where id=task.id;
      insert into public.daily_tasks(daily_plan_id,workspace_id,source_type,source_id,task_type,title,notes,estimated_minutes,required,due_at,sort_order,track_id,topic_id,target_count,target_unit,carryover_from_task_id,carryover_count,generation_key)
        values(destination_plan.id,ws.id,task.source_type,task.source_id,task.task_type,task.title,task.notes,task.estimated_minutes,task.required,task.due_at,(select count(*) from public.daily_tasks where daily_plan_id=destination_plan.id),task.track_id,task.topic_id,task.target_count,task.target_unit,task.id,task.carryover_count+case when (select plan_date from public.daily_plans where id=task.daily_plan_id)<p_day then 1 else 0 end,task.generation_key);
      update public.daily_plans set planned_minutes=planned_minutes+task.estimated_minutes,updated_at=now() where id=destination_plan.id;
    end if;
    update public.daily_tasks set status=case action when 'start' then 'in_progress' when 'complete' then 'completed' when 'skip' then 'skipped' else 'deferred' end,
      started_at=case when action in ('start','complete') then coalesce(started_at,now()) else started_at end,
      completed_at=case when action='complete' then now() else null end,version=version+1,updated_at=now() where id=task.id;
    event:=case action when 'start' then 'daily_task.started' when 'complete' then 'daily_task.completed' when 'skip' then 'daily_task.skipped' else 'daily_task.deferred' end;
    task_id:=task.id;
    if action='complete' and exists(select 1 from public.daily_tasks where daily_plan_id=plan.id and required) and not exists(select 1 from public.daily_tasks where daily_plan_id=plan.id and required and status not in ('completed','deferred','cancelled')) then
      insert into public.today_activity_events(workspace_id,daily_plan_id,user_id,event_type) values(ws.id,plan.id,actor,'daily_plan.completed');
    end if;
  end if;
  if event is not null then insert into public.today_activity_events(workspace_id,daily_plan_id,user_id,event_type,task_id) values(ws.id,case when task.id is not null then task.daily_plan_id else plan.id end,actor,event,task_id); end if;
  return plan.id;
end;
$$;
