-- Unified execution lifecycle. Session-local prompt snapshots are not a question catalog.
create table public.execution_sessions (
  id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,source_type text not null check(source_type in ('manual','task')),
  task_id uuid,task_type text not null default 'custom' check(task_type in ('dsa','revision','aptitude','language','fundamentals','projects','behavioral','interview','timed_practice','custom')),
  mode text not null check(mode in ('practice','interview','oa')),status text not null default 'active' check(status in ('active','paused','completed','expired','abandoned')),
  started_at timestamptz not null default now(),paused_at timestamptz,accumulated_pause_ms bigint not null default 0 check(accumulated_pause_ms>=0),pause_count integer not null default 0 check(pause_count>=0),
  completed_at timestamptz,expires_at timestamptz,target_duration_seconds integer check(target_duration_seconds between 60 and 14400),
  completion_reason text check(completion_reason in ('user_finished','submitted','time_expired','abandoned','session_invalidated')),
  policy_version text not null default 'execution-policy-v1' check(policy_version='execution-policy-v1'),version integer not null default 0 check(version>=0),
  current_item_id uuid,phase text not null default 'understand' check(phase in ('understand','clarify','approach','implement','test','review')),
  checklist text[] not null default '{}' check(checklist<@array['assumptions','approach','complexity','edge_cases','tradeoffs']::text[] and cardinality(checklist)<=5),
  launch_request_id uuid not null,launch_hash text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  unique(id,workspace_id,user_id),unique(workspace_id,user_id,launch_request_id),
  foreign key(task_id,workspace_id) references public.daily_tasks(id,workspace_id) on delete restrict,
  check((source_type='manual' and task_id is null) or (source_type='task' and task_id is not null)),
  check((status='paused')=(paused_at is not null)),check(paused_at is null or paused_at>=started_at),
  check((status in ('completed','expired','abandoned'))=(completed_at is not null)),check(completed_at is null or completed_at>=started_at),
  check((status in ('completed','expired','abandoned'))=(completion_reason is not null)),
  check(mode='practice' or (status<>'paused' and paused_at is null and accumulated_pause_ms=0 and target_duration_seconds is not null)),
  check((mode='practice' and expires_at is null) or (mode<>'practice' and expires_at=started_at+target_duration_seconds*interval '1 second'))
);
create unique index execution_one_active on public.execution_sessions(workspace_id,user_id) where status in ('active','paused');
create index execution_user_status on public.execution_sessions(user_id,status);
create index execution_workspace_history on public.execution_sessions(workspace_id,user_id,started_at desc);
create index execution_task on public.execution_sessions(task_id,workspace_id) where task_id is not null;
create table public.execution_session_items (
  id uuid primary key default gen_random_uuid(),session_id uuid not null,workspace_id uuid not null,user_id uuid not null,
  position integer not null check(position between 0 and 9),title text not null check(length(btrim(title)) between 1 and 160),
  body text not null default '' check(length(body)<=12000),topic text not null default '' check(length(topic)<=120),
  difficulty text not null default 'unspecified' check(difficulty in ('easy','medium','hard','unspecified')),
  constraints_text text not null default '' check(length(constraints_text)<=4000),examples jsonb not null default '[]' check(jsonb_typeof(examples)='array' and jsonb_array_length(examples)<=6 and octet_length(examples::text)<=30000),
  code text not null default '' check(length(code)<=64000),language text not null default 'typescript' check(language in ('typescript','javascript','java','python','cpp','text')),
  scratchpad text not null default '' check(length(scratchpad)<=12000),answer text not null default '' check(length(answer)<=12000),
  status text not null default 'unseen' check(status in ('unseen','viewed','attempted','answered')),flagged boolean not null default false,
  hints_available integer not null default 0 check(hints_available between 0 and 3),first_viewed_at timestamptz,last_viewed_at timestamptz,answered_at timestamptz,
  unique(id,session_id,workspace_id,user_id),unique(session_id,position),
  foreign key(session_id,workspace_id,user_id) references public.execution_sessions(id,workspace_id,user_id) on delete cascade
);
create index execution_items_owner on public.execution_session_items(workspace_id,user_id);
alter table public.execution_sessions add constraint execution_current_item_owned foreign key(current_item_id,id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) deferrable initially deferred;
create table public.execution_item_hints (
  item_id uuid not null,session_id uuid not null,workspace_id uuid not null,user_id uuid not null,
  level integer not null check(level between 1 and 3),title text not null check(length(btrim(title)) between 1 and 80),body text not null check(length(btrim(body)) between 1 and 2000),
  primary key(item_id,level),foreign key(item_id,session_id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) on delete cascade
);
create index execution_hints_owner on public.execution_item_hints(workspace_id,user_id);
create table public.execution_hint_uses (
  id uuid primary key default gen_random_uuid(),item_id uuid not null,session_id uuid not null,workspace_id uuid not null,user_id uuid not null,
  level integer not null,revealed_at timestamptz not null default now(),elapsed_ms bigint not null check(elapsed_ms>=0),
  foreign key(item_id,session_id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) on delete cascade,
  foreign key(item_id,level) references public.execution_item_hints(item_id,level) on delete restrict,unique(item_id,level)
);
create index execution_hint_uses_owner on public.execution_hint_uses(workspace_id,user_id,session_id);
create table public.execution_focus_intervals (
  id uuid primary key default gen_random_uuid(),session_id uuid not null,item_id uuid not null,workspace_id uuid not null,user_id uuid not null,
  started_at timestamptz not null default now(),ended_at timestamptz,check(ended_at is null or ended_at>=started_at),
  foreign key(item_id,session_id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) on delete cascade
);
create unique index execution_one_open_interval on public.execution_focus_intervals(session_id) where ended_at is null;
create index execution_focus_owner_time on public.execution_focus_intervals(workspace_id,user_id,started_at);
create index execution_focus_item on public.execution_focus_intervals(item_id);
create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),session_id uuid not null,item_id uuid not null,workspace_id uuid not null,user_id uuid not null,
  duration_ms bigint not null check(duration_ms>=0),target_duration_ms bigint check(target_duration_ms>0),
  reflection_status text not null default 'pending' check(reflection_status in ('pending','completed')),
  result text check(result in ('solved_independently','solved_small_hint','solved_major_hint','could_not_solve')),
  approach text not null default '' check(length(approach)<=2000),pattern_id text references public.patterns(id) on delete restrict,
  time_complexity text not null default '' check(length(time_complexity)<=100),space_complexity text not null default '' check(length(space_complexity)<=100),
  confidence integer check(confidence between 1 and 5),mistakes text[] not null default '{}' check(mistakes<@array['recognition','logic','syntax','edge_case','complexity','forgotten_concept','communication','time_management']::text[] and cardinality(mistakes)<=8),
  notes text not null default '' check(length(notes)<=4000),completed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  unique(item_id),unique(id,workspace_id,user_id),
  foreign key(item_id,session_id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) on delete cascade,
  check(reflection_status<>'completed' or (result is not null and confidence is not null and completed_at is not null))
);
create index question_attempts_workspace_time on public.question_attempts(workspace_id,user_id,created_at desc);
create index question_attempts_session on public.question_attempts(session_id);
create index question_attempts_pattern on public.question_attempts(pattern_id) where pattern_id is not null;
create table public.execution_events (
  id uuid primary key default gen_random_uuid(),session_id uuid not null,workspace_id uuid not null,user_id uuid not null,
  request_id uuid not null,request_hash text not null,event_type text not null check(event_type in ('started','paused','resumed','completed','expired','abandoned','question_viewed','draft_saved','flag_changed','answer_changed','hint_revealed','phase_changed','checklist_changed','debrief_draft','attempt_completed')),
  item_id uuid,phase text check(phase in ('understand','clarify','approach','implement','test','review')),hint_level integer check(hint_level between 1 and 3),
  elapsed_ms bigint not null default 0 check(elapsed_ms>=0),created_at timestamptz not null default now(),
  foreign key(session_id,workspace_id,user_id) references public.execution_sessions(id,workspace_id,user_id) on delete cascade,
  foreign key(item_id,session_id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) on delete cascade,
  unique(session_id,request_id)
);
create index execution_events_owner on public.execution_events(workspace_id,user_id,session_id,created_at);
create index execution_events_item on public.execution_events(item_id) where item_id is not null;
create table public.attempt_outbox_events (
  id uuid primary key default gen_random_uuid(),workspace_id uuid not null,user_id uuid not null,attempt_id uuid not null,
  event_type text not null default 'attempt.completed' check(event_type='attempt.completed'),policy_version text not null default 'attempt-event-v1',
  payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<16000),created_at timestamptz not null default now(),
  foreign key(attempt_id,workspace_id,user_id) references public.question_attempts(id,workspace_id,user_id) on delete cascade,
  unique(attempt_id,event_type)
);
create index attempt_outbox_workspace on public.attempt_outbox_events(workspace_id,user_id,created_at);

do $$declare t text;begin
  foreach t in array array['execution_sessions','execution_session_items','execution_item_hints','execution_hint_uses','execution_focus_intervals','question_attempts','execution_events','attempt_outbox_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('alter table public.%I force row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    if t<>'execution_item_hints' then
      execute format('create policy execution_owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()) and public.is_workspace_member(workspace_id))',t);
    end if;
  end loop;
end $$;
create policy revealed_hint_read on public.execution_item_hints for select to authenticated using(user_id=(select auth.uid()) and public.is_workspace_member(workspace_id) and exists(select 1 from public.execution_hint_uses h where h.item_id=execution_item_hints.item_id and h.level=execution_item_hints.level and h.user_id=(select auth.uid())));

create function private.finish_execution(p_session uuid,p_reason text,p_at timestamptz) returns void language plpgsql security definer set search_path='' as $$
declare s public.execution_sessions%rowtype;ended timestamptz;
begin
  select * into s from public.execution_sessions where id=p_session for update;
  if s.status not in ('active','paused') then return;end if;
  ended:=greatest(s.started_at,p_at);
  update public.execution_focus_intervals set ended_at=greatest(started_at,ended) where session_id=s.id and ended_at is null;
  update public.execution_sessions set status=case when p_reason='time_expired' then 'expired' when p_reason='abandoned' then 'abandoned' else 'completed' end,
    accumulated_pause_ms=accumulated_pause_ms+case when paused_at is not null then greatest(0,floor(extract(epoch from ended-paused_at)*1000)::bigint) else 0 end,
    paused_at=null,completed_at=ended,completion_reason=p_reason,version=version+1,updated_at=now() where id=s.id;
  if p_reason<>'abandoned' then
    insert into public.question_attempts(session_id,item_id,workspace_id,user_id,duration_ms,target_duration_ms)
      select s.id,i.id,s.workspace_id,s.user_id,coalesce((select sum(floor(extract(epoch from f.ended_at-f.started_at)*1000)) from public.execution_focus_intervals f where f.item_id=i.id),0)::bigint,
        case when s.mode<>'oa' and (select count(*) from public.execution_session_items where session_id=s.id)=1 then s.target_duration_seconds::bigint*1000 else null end
      from public.execution_session_items i where i.session_id=s.id on conflict(item_id) do nothing;
  end if;
end $$;
revoke all on function private.finish_execution(uuid,text,timestamptz) from public,anon,authenticated;

create function private.execution_snapshot(p_session uuid) returns jsonb language sql security definer set search_path='' as $$
select jsonb_build_object(
  'session',to_jsonb(s),'serverNow',now(),
  'workspace',jsonb_build_object('id',w.id,'slug',w.slug,'name',w.name,'timezone',w.timezone),
  'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('hints',coalesce((select jsonb_agg(jsonb_build_object('level',h.level,'title',h.title,'body',h.body,'revealed_at',u.revealed_at) order by h.level) from public.execution_item_hints h join public.execution_hint_uses u on u.item_id=h.item_id and u.level=h.level where h.item_id=i.id),'[]'::jsonb)) order by i.position) from public.execution_session_items i where i.session_id=s.id),'[]'::jsonb),
  'attempts',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at,a.id) from public.question_attempts a where a.session_id=s.id),'[]'::jsonb),
  'events',coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at,e.id) from public.execution_events e where e.session_id=s.id and e.event_type not in ('draft_saved','debrief_draft')),'[]'::jsonb),
  'patterns',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name) order by p.name) from public.patterns p),'[]'::jsonb)
) from public.execution_sessions s join public.workspaces w on w.id=s.workspace_id where s.id=p_session
$$;
revoke all on function private.execution_snapshot(uuid) from public,anon,authenticated;

create function private.resolve_execution(p_slug text,p_session uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid());s public.execution_sessions%rowtype;w public.workspaces%rowtype;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501';end if;
  select * into w from public.workspaces where slug=p_slug for share;
  if w.id is null or not exists(select 1 from public.workspace_members where workspace_id=w.id and user_id=actor and status='active' for share) then raise exception 'Workspace unavailable' using errcode='42501';end if;
  select * into s from public.execution_sessions where id=p_session and workspace_id=w.id and user_id=actor for update;
  if s.id is null then raise exception 'Session unavailable' using errcode='42501';end if;
  if s.status in ('active','paused') and s.expires_at is not null and now()>=s.expires_at then
    perform private.finish_execution(s.id,'time_expired',s.expires_at);
    insert into public.execution_events(session_id,workspace_id,user_id,request_id,request_hash,event_type,elapsed_ms) values(s.id,w.id,actor,gen_random_uuid(),'expiry','expired',s.target_duration_seconds::bigint*1000);
  end if;
  return private.execution_snapshot(s.id);
end $$;
revoke all on function private.resolve_execution(text,uuid) from public,anon,service_role;
grant execute on function private.resolve_execution(text,uuid) to authenticated;
create function public.resolve_execution(p_slug text,p_session uuid) returns jsonb language sql security invoker set search_path='' as $$select private.resolve_execution(p_slug,p_session)$$;
revoke all on function public.resolve_execution(text,uuid) from public,anon,service_role;
grant execute on function public.resolve_execution(text,uuid) to authenticated;

create function private.create_execution(p_slug text,p_request uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=(select auth.uid());w public.workspaces%rowtype;s public.execution_sessions%rowtype;existing public.execution_sessions%rowtype;task public.daily_tasks%rowtype;
  prompt jsonb;hint jsonb;item_id uuid;first_item uuid;position integer:=0;level integer;duration integer:=(p_payload->>'targetSeconds')::integer;mode text:=p_payload->>'mode';source text:=p_payload->>'source';launch_hash text:=md5(p_payload::text);
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501';end if;
  -- Serialize launches per user/workspace even before an active session row exists.
  select * into w from public.workspaces where slug=p_slug for update;
  if w.id is null or w.status<>'active' or not exists(select 1 from public.workspace_members where workspace_id=w.id and user_id=actor and status='active' for share) then raise exception 'Workspace unavailable or read-only' using errcode='42501';end if;
  if p_request is null or p_payload is null or octet_length(p_payload::text)>200000 or jsonb_typeof(p_payload->'prompts') is distinct from 'array' or jsonb_array_length(p_payload->'prompts') not between 1 and 10 or mode not in ('practice','interview','oa') or mode is null or source not in ('manual','task') or source is null then raise exception 'Invalid session launch' using errcode='22023';end if;
  if mode='interview' and jsonb_array_length(p_payload->'prompts')<>1 then raise exception 'Interview practice uses one question' using errcode='22023';end if;
  if (mode<>'practice' and duration is null) or (duration is not null and duration not between 60 and 14400) then raise exception 'Choose a valid session duration' using errcode='22023';end if;
  select * into existing from public.execution_sessions where workspace_id=w.id and user_id=actor and launch_request_id=p_request;
  if existing.id is not null then
    if existing.launch_hash<>launch_hash then raise exception 'Session request changed' using errcode='40001';end if;
    return jsonb_build_object('ok',true,'data',private.resolve_execution(p_slug,existing.id));
  end if;
  select * into existing from public.execution_sessions where workspace_id=w.id and user_id=actor and status in ('active','paused') for update;
  if existing.id is not null then
    perform private.resolve_execution(p_slug,existing.id);
    select * into existing from public.execution_sessions where id=existing.id;
    if existing.status in ('active','paused') then return jsonb_build_object('ok',false,'code','active_session','data',private.execution_snapshot(existing.id));end if;
  end if;
  if source='task' then
    select * into task from public.daily_tasks where id=(p_payload->>'taskId')::uuid and workspace_id=w.id for update;
    if task.id is null or task.source_type<>'custom' or task.status not in ('planned','in_progress') then raise exception 'Choose an available custom planning task' using errcode='22023';end if;
    if not exists(select 1 from public.daily_plans where id=task.daily_plan_id and plan_date=(now() at time zone w.timezone)::date and lifecycle='active' and status='active') then raise exception 'Move this task to an active Today plan before starting' using errcode='22023';end if;
  end if;
  insert into public.execution_sessions(workspace_id,user_id,source_type,task_id,task_type,mode,target_duration_seconds,expires_at,launch_request_id,launch_hash)
    values(w.id,actor,source,task.id,coalesce(task.task_type,'custom'),mode,duration,case when mode<>'practice' then now()+duration*interval '1 second' else null end,p_request,launch_hash) returning * into s;
  for prompt in select * from jsonb_array_elements(p_payload->'prompts') loop
    if jsonb_typeof(coalesce(prompt->'examples','[]')) is distinct from 'array' or exists(select 1 from jsonb_array_elements(coalesce(prompt->'examples','[]')) e where jsonb_typeof(e) is distinct from 'object' or jsonb_typeof(e->'input') is distinct from 'string' or jsonb_typeof(e->'output') is distinct from 'string' or jsonb_typeof(e->'explanation') is distinct from 'string' or length(e->>'input')>1000 or length(e->>'output')>1000 or length(e->>'explanation')>2000) then raise exception 'Invalid question examples' using errcode='22023';end if;
    if jsonb_typeof(prompt->'hints') is distinct from 'array' or jsonb_array_length(prompt->'hints')>3 then raise exception 'Invalid structured hints' using errcode='22023';end if;
    insert into public.execution_session_items(session_id,workspace_id,user_id,position,title,body,topic,difficulty,constraints_text,examples,hints_available,status,first_viewed_at,last_viewed_at)
      values(s.id,w.id,actor,position,btrim(prompt->>'title'),coalesce(prompt->>'body',''),coalesce(prompt->>'topic',''),coalesce(prompt->>'difficulty','unspecified'),coalesce(prompt->>'constraints',''),coalesce(prompt->'examples','[]'),jsonb_array_length(prompt->'hints'),case when position=0 then 'viewed' else 'unseen' end,case when position=0 then now() else null end,case when position=0 then now() else null end) returning id into item_id;
    if position=0 then first_item:=item_id;end if;
    level:=1;
    for hint in select * from jsonb_array_elements(prompt->'hints') loop
      insert into public.execution_item_hints(item_id,session_id,workspace_id,user_id,level,title,body) values(item_id,s.id,w.id,actor,level,hint->>'title',hint->>'body');level:=level+1;
    end loop;
    position:=position+1;
  end loop;
  update public.execution_sessions set current_item_id=first_item where id=s.id;
  insert into public.execution_focus_intervals(session_id,item_id,workspace_id,user_id) values(s.id,first_item,w.id,actor);
  insert into public.execution_events(session_id,workspace_id,user_id,request_id,request_hash,event_type,item_id) values(s.id,w.id,actor,p_request,launch_hash,'started',first_item);
  if task.id is not null and task.status='planned' then
    perform private.mutate_today(p_slug,(now() at time zone w.timezone)::date,jsonb_build_object('kind','start','taskId',task.id,'version',task.version));
  end if;
  return jsonb_build_object('ok',true,'data',private.execution_snapshot(s.id));
end $$;
revoke all on function private.create_execution(text,uuid,jsonb) from public,anon,service_role;
grant execute on function private.create_execution(text,uuid,jsonb) to authenticated;
create function public.create_execution(p_slug text,p_request uuid,p_payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.create_execution(p_slug,p_request,p_payload)$$;
revoke all on function public.create_execution(text,uuid,jsonb) from public,anon,service_role;
grant execute on function public.create_execution(text,uuid,jsonb) to authenticated;

create function private.mutate_execution(p_slug text,p_session uuid,p_version integer,p_request uuid,p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
<<execution_command>>
declare
  actor uuid:=(select auth.uid());s public.execution_sessions%rowtype;w public.workspaces%rowtype;i public.execution_session_items%rowtype;a public.question_attempts%rowtype;prior public.execution_events%rowtype;
  action text:=p_command->>'kind';event text;elapsed bigint;hint_level integer;max_hint integer;request_hash text:=md5(p_command::text);mistakes text[];checklist text[];result text;confidence integer;attempt_payload jsonb;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501';end if;
  select * into w from public.workspaces where slug=p_slug for share;
  if w.id is null or w.status<>'active' or not exists(select 1 from public.workspace_members where workspace_id=w.id and user_id=actor and status='active' for share) then raise exception 'Workspace unavailable or read-only' using errcode='42501';end if;
  select * into s from public.execution_sessions where id=p_session and workspace_id=w.id and user_id=actor for update;
  if s.id is null then raise exception 'Session unavailable' using errcode='42501';end if;
  if p_request is null or p_command is null or octet_length(p_command::text)>120000 or action is null or action not in ('pause','resume','finish','abandon','sync','navigate','draft','flag','answer','hint','phase','checklist','debrief_draft','debrief') then raise exception 'Invalid execution command' using errcode='22023';end if;
  select * into prior from public.execution_events where session_id=s.id and request_id=p_request;
  if prior.id is not null then
    if prior.request_hash<>request_hash then raise exception 'Execution request identifier conflict' using errcode='40001';end if;
    if prior.event_type='expired' and action not in ('sync','finish') then return jsonb_build_object('ok',false,'code','expired','data',private.resolve_execution(p_slug,s.id));end if;
    return jsonb_build_object('ok',true,'data',private.resolve_execution(p_slug,s.id));
  end if;
  -- Persist expiry, then return a rejection envelope; raising would roll back the deadline transition.
  if s.status in ('active','paused') and s.expires_at is not null and now()>=s.expires_at then
    perform private.finish_execution(s.id,'time_expired',s.expires_at);
    insert into public.execution_events(session_id,workspace_id,user_id,request_id,request_hash,event_type,elapsed_ms) values(s.id,w.id,actor,p_request,request_hash,'expired',s.target_duration_seconds::bigint*1000);
    return jsonb_build_object('ok',action in ('sync','finish'),'code','expired','data',private.execution_snapshot(s.id));
  end if;
  if action='sync' then return jsonb_build_object('ok',true,'data',private.execution_snapshot(s.id));end if;
  if s.status in ('completed','expired','abandoned') and action in ('finish','abandon') then return jsonb_build_object('ok',true,'data',private.execution_snapshot(s.id));end if;
  if s.version is distinct from p_version then raise exception 'Session changed on another tab. Refresh before retrying.' using errcode='40001';end if;
  elapsed:=greatest(0,floor(extract(epoch from coalesce(s.paused_at,s.completed_at,now())-s.started_at)*1000)::bigint-s.accumulated_pause_ms);
  if action in ('debrief_draft','debrief') then
    if s.status not in ('completed','expired') then raise exception 'Finish timing before entering the debrief' using errcode='22023';end if;
    select * into a from public.question_attempts where id=(p_command->>'attemptId')::uuid and session_id=s.id and workspace_id=w.id and user_id=actor for update;
    if a.id is null then raise exception 'Attempt unavailable' using errcode='42501';end if;
    if a.reflection_status='completed' then raise exception 'This debrief is already committed and read-only' using errcode='22023';end if;
    result:=p_command->>'result';confidence:=(p_command->>'confidence')::integer;
    select coalesce(array_agg(value),'{}') into mistakes from jsonb_array_elements_text(p_command->'mistakes');
    if cardinality(mistakes)<>(select count(distinct v) from unnest(mistakes) v) then raise exception 'Duplicate mistake category' using errcode='22023';end if;
    if action='debrief' then
      if result is null or confidence is null then raise exception 'Choose an outcome and confidence' using errcode='22023';end if;
      select coalesce(max(level),0) into max_hint from public.execution_hint_uses where item_id=a.item_id;
      if (max_hint>0 and result='solved_independently') or (max_hint>1 and result='solved_small_hint') then raise exception 'The selected outcome must reflect the hints used' using errcode='22023';end if;
    end if;
    update public.question_attempts set result=execution_command.result,approach=coalesce(p_command->>'approach',''),pattern_id=p_command->>'patternId',time_complexity=coalesce(p_command->>'timeComplexity',''),space_complexity=coalesce(p_command->>'spaceComplexity',''),confidence=execution_command.confidence,mistakes=execution_command.mistakes,notes=coalesce(p_command->>'notes',''),
      reflection_status=case when action='debrief' then 'completed' else 'pending' end,completed_at=case when action='debrief' then now() else null end,updated_at=now() where id=a.id returning * into a;
    if action='debrief' then
      attempt_payload:=jsonb_build_object('attempt_id',a.id,'workspace_id',w.id,'session_id',s.id,'item_id',a.item_id,'result',a.result,'confidence',a.confidence,'mistake_categories',a.mistakes,'completed_at',a.completed_at,'hint_evidence',coalesce((select jsonb_agg(jsonb_build_object('level',h.level,'revealed_at',h.revealed_at,'elapsed_ms',h.elapsed_ms) order by h.level) from public.execution_hint_uses h where h.item_id=a.item_id),'[]'::jsonb));
      insert into public.attempt_outbox_events(workspace_id,user_id,attempt_id,payload) values(w.id,actor,a.id,attempt_payload) on conflict(attempt_id,event_type) do nothing;
    end if;
    event:=case when action='debrief' then 'attempt_completed' else 'debrief_draft' end;
  else
    if s.status not in ('active','paused') then raise exception 'This session has ended. Working state is locked.' using errcode='22023';end if;
    if action='pause' then
      if s.mode<>'practice' or s.status<>'active' then raise exception 'Pause is unavailable under this mode policy' using errcode='22023';end if;
      update public.execution_focus_intervals set ended_at=now() where session_id=s.id and ended_at is null;
      update public.execution_sessions set paused_at=now(),status='paused',pause_count=pause_count+1 where id=s.id;event:='paused';
    elsif action='resume' then
      if s.mode<>'practice' or s.status<>'paused' then raise exception 'Resume is unavailable in this state' using errcode='22023';end if;
      update public.execution_sessions set accumulated_pause_ms=accumulated_pause_ms+greatest(0,floor(extract(epoch from now()-paused_at)*1000)::bigint),paused_at=null,status='active' where id=s.id;
      insert into public.execution_focus_intervals(session_id,item_id,workspace_id,user_id) values(s.id,s.current_item_id,w.id,actor);event:='resumed';
    elsif action in ('finish','abandon') then
      perform private.finish_execution(s.id,case when action='abandon' then 'abandoned' when s.mode='oa' then 'submitted' else 'user_finished' end,now());event:=case when action='abandon' then 'abandoned' else 'completed' end;
    else
      if s.status<>'active' then raise exception 'Resume the practice session before editing' using errcode='22023';end if;
      if action in ('navigate','draft','flag','answer','hint') then
        select * into i from public.execution_session_items where id=(p_command->>'itemId')::uuid and session_id=s.id and workspace_id=w.id and user_id=actor for update;
        if i.id is null then raise exception 'Question unavailable' using errcode='42501';end if;
      end if;
      if action='navigate' then
        if s.current_item_id<>i.id then
          update public.execution_focus_intervals set ended_at=now() where session_id=s.id and ended_at is null;
          insert into public.execution_focus_intervals(session_id,item_id,workspace_id,user_id) values(s.id,i.id,w.id,actor);
          update public.execution_sessions set current_item_id=i.id where id=s.id;
        end if;
        update public.execution_session_items set status=case when status='unseen' then 'viewed' else status end,first_viewed_at=coalesce(first_viewed_at,now()),last_viewed_at=now() where id=i.id;event:='question_viewed';
      elsif action='draft' then
        update public.execution_session_items set code=coalesce(p_command->>'code',''),language=p_command->>'language',scratchpad=coalesce(p_command->>'scratchpad',''),answer=coalesce(p_command->>'answer',''),status=case when status='answered' then status when length(btrim(coalesce(p_command->>'code','')||coalesce(p_command->>'answer','')))>0 then 'attempted' else 'viewed' end where id=i.id;event:='draft_saved';
      elsif action='flag' then update public.execution_session_items set flagged=(p_command->>'flagged')::boolean where id=i.id;event:='flag_changed';
      elsif action='answer' then update public.execution_session_items set status=case when (p_command->>'answered')::boolean then 'answered' else 'attempted' end,answered_at=case when (p_command->>'answered')::boolean then now() else null end where id=i.id;event:='answer_changed';
      elsif action='hint' then
        hint_level:=(p_command->>'level')::integer;
        if s.mode='oa' then raise exception 'Hints are not permitted in OA mode' using errcode='22023';end if;
        if hint_level is null or not exists(select 1 from public.execution_item_hints where item_id=i.id and level=hint_level) then raise exception 'This structured hint is unavailable' using errcode='22023';end if;
        if not exists(select 1 from public.execution_hint_uses where item_id=i.id and level=hint_level) then
          if s.mode='interview' and (select count(*) from public.execution_hint_uses where session_id=s.id)>=2 then raise exception 'The interview hint limit has been reached' using errcode='22023';end if;
          if hint_level>1 and not exists(select 1 from public.execution_hint_uses where item_id=i.id and level=hint_level-1) then raise exception 'Reveal the earlier hint first' using errcode='22023';end if;
          insert into public.execution_hint_uses(item_id,session_id,workspace_id,user_id,level,elapsed_ms) values(i.id,s.id,w.id,actor,hint_level,elapsed);
        end if;
        event:='hint_revealed';
      elsif action='phase' then
        if s.mode<>'interview' then raise exception 'Phase tracking belongs to Interview practice' using errcode='22023';end if;
        update public.execution_sessions set phase=p_command->>'phase' where id=s.id;event:='phase_changed';
      elsif action='checklist' then
        if s.mode<>'interview' then raise exception 'Communication checklist belongs to Interview practice' using errcode='22023';end if;
        select coalesce(array_agg(distinct value),'{}') into checklist from jsonb_array_elements_text(p_command->'items');
        update public.execution_sessions set checklist=execution_command.checklist where id=s.id;event:='checklist_changed';
      end if;
    end if;
  end if;
  update public.execution_sessions set version=version+1,updated_at=now() where id=s.id;
  insert into public.execution_events(session_id,workspace_id,user_id,request_id,request_hash,event_type,item_id,phase,hint_level,elapsed_ms)
    values(s.id,w.id,actor,p_request,request_hash,event,coalesce(i.id,a.item_id),case when action='phase' then p_command->>'phase' else null end,hint_level,elapsed);
  return jsonb_build_object('ok',true,'data',private.execution_snapshot(s.id));
end $$;
revoke all on function private.mutate_execution(text,uuid,integer,uuid,jsonb) from public,anon,service_role;
grant execute on function private.mutate_execution(text,uuid,integer,uuid,jsonb) to authenticated;
create function public.mutate_execution(p_slug text,p_session uuid,p_version integer,p_request uuid,p_command jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.mutate_execution(p_slug,p_session,p_version,p_request,p_command)$$;
revoke all on function public.mutate_execution(text,uuid,integer,uuid,jsonb) from public,anon,service_role;
grant execute on function public.mutate_execution(text,uuid,integer,uuid,jsonb) to authenticated;

create function public.execution_focus(p_workspace uuid,p_from timestamptz,p_to timestamptz) returns table(workspace_id uuid,started_at timestamptz,ended_at timestamptz,task_type text)
language sql stable security invoker set search_path='' as $$
  select f.workspace_id,greatest(f.started_at,p_from),least(coalesce(f.ended_at,s.expires_at,now()),coalesce(s.expires_at,now()),now(),p_to),s.task_type
  from public.execution_focus_intervals f join public.execution_sessions s on s.id=f.session_id
  where f.workspace_id=p_workspace and f.user_id=(select auth.uid()) and f.started_at<p_to and coalesce(f.ended_at,s.expires_at,now())>p_from
    and least(coalesce(f.ended_at,s.expires_at,now()),coalesce(s.expires_at,now()),now(),p_to)>greatest(f.started_at,p_from)
$$;
revoke all on function public.execution_focus(uuid,timestamptz,timestamptz) from public,anon,service_role;
grant execute on function public.execution_focus(uuid,timestamptz,timestamptz) to authenticated;

create function public.execution_task_links(p_workspace uuid,p_tasks uuid[]) returns table(task_id uuid,session_id uuid,status text)
language sql stable security invoker set search_path='' as $$
  select distinct on(s.task_id) s.task_id,s.id,s.status from public.execution_sessions s
  where s.workspace_id=p_workspace and s.user_id=(select auth.uid()) and s.task_id=any(p_tasks) and cardinality(p_tasks)<=200
    and (s.status in ('active','paused') or (s.status in ('completed','expired') and exists(select 1 from public.question_attempts a where a.session_id=s.id and a.reflection_status='pending')))
  order by s.task_id,s.started_at desc
$$;
revoke all on function public.execution_task_links(uuid,uuid[]) from public,anon,service_role;
grant execute on function public.execution_task_links(uuid,uuid[]) to authenticated;

create function private.execution_week_minutes(p_workspace uuid,p_user uuid,p_week date,p_timezone text) returns integer
language sql stable security definer set search_path='' as $$
  select coalesce(floor(sum(extract(epoch from least(coalesce(f.ended_at,s.expires_at,now()),coalesce(s.expires_at,now()),now(),((p_week+7)::timestamp at time zone p_timezone))-greatest(f.started_at,(p_week::timestamp at time zone p_timezone))))/60),0)::integer
  from public.execution_focus_intervals f join public.execution_sessions s on s.id=f.session_id
  where f.workspace_id=p_workspace and f.user_id=p_user and f.started_at<((p_week+7)::timestamp at time zone p_timezone)
    and least(coalesce(f.ended_at,s.expires_at,now()),coalesce(s.expires_at,now()),now())>(p_week::timestamp at time zone p_timezone)
$$;
revoke all on function private.execution_week_minutes(uuid,uuid,date,text) from public,anon,authenticated;

-- Planning closes an immutable snapshot using Execution's recorded focus projection.
create or replace function private.mutate_planning(p_slug text,p_week date,p_revision bigint,p_request uuid,p_context text,p_command jsonb) returns bigint
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
    select jsonb_build_object('plannedMinutes',coalesce(sum(t.estimated_minutes) filter(where t.status not in ('deferred','cancelled')),0),'completedTasks',count(t.id) filter(where t.status='completed'),'totalTasks',count(t.id) filter(where t.status not in ('deferred','cancelled')),'focusedMinutes',private.execution_week_minutes(ws.id,actor,p_week,ws.timezone),'carryoverCount',count(t.id) filter(where t.status='deferred'),'observations',jsonb_build_array('Closed from recorded schedule outcomes. Focused minutes come from active execution intervals.')) into closed_summary
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
