-- Additive repair for deployed Execution contracts.
create or replace function private.create_execution(p_slug text,p_request uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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

do $$begin
if not exists(select 1 from pg_constraint where conrelid='public.execution_events'::regclass and contype='f' and confrelid='public.execution_session_items'::regclass) then
alter table public.execution_events add constraint execution_events_item_scope foreign key(item_id,session_id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) on delete cascade;
end if;end $$;
