-- Explicitly review timezone changes without overwriting tasks; serialize membership revocation and bound rescheduling.
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
