-- Execution owns explicit topic attribution. Mastery interprets these references only.
create table public.execution_topic_attributions (
 item_id uuid primary key,session_id uuid not null,workspace_id uuid not null,user_id uuid not null,
 topic_id text not null references public.topics(id) on delete restrict,created_at timestamptz not null default now(),
 foreign key(item_id,session_id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) on delete cascade
);
create index execution_topic_owner on public.execution_topic_attributions(workspace_id,user_id,topic_id);
create index execution_topic_canonical on public.execution_topic_attributions(topic_id);
alter table public.execution_topic_attributions enable row level security;
alter table public.execution_topic_attributions force row level security;
revoke all on public.execution_topic_attributions from public,anon,authenticated;
grant select on public.execution_topic_attributions to authenticated;
create policy execution_topic_owner_read on public.execution_topic_attributions for select to authenticated using(user_id=(select auth.uid()) and public.is_workspace_member(workspace_id));

create function private.execution_topic_allowed(p_workspace uuid,p_topic text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.topics t join public.template_version_topics vt on vt.topic_id=t.id
 where t.id=p_topic and vt.template_version_id=coalesce((select template_version_id from public.workspace_curricula where workspace_id=p_workspace),
 (select v.id from public.workspace_targets wt join public.preparation_template_versions v on v.template_id=wt.template_id and v.version_number=coalesce(wt.template_version,1) where wt.workspace_id=p_workspace))
 and not exists(select 1 from public.workspace_curriculum_overrides o where o.workspace_id=p_workspace and o.override_type='inclusion' and o.value->>'included'='false' and ((o.entity_type='topic' and o.entity_id=t.id) or (o.entity_type='track' and o.entity_id=t.track_id))))
$$;
revoke all on function private.execution_topic_allowed(uuid,text) from public,anon,authenticated,service_role;
create function private.assign_execution_topic(p_slug text,p_item uuid,p_topic text) returns void language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;i public.execution_session_items%rowtype;existing text;begin
 w:=private.revision_access(p_slug,true);
 select * into i from public.execution_session_items where id=p_item and workspace_id=w.id and user_id=(select auth.uid()) for update;
 if i.id is null then raise exception 'Question evidence unavailable' using errcode='42501';end if;
 if not private.execution_topic_allowed(w.id,p_topic) then raise exception 'Choose a topic from the active workspace curriculum' using errcode='22023';end if;
 select topic_id into existing from public.execution_topic_attributions where item_id=i.id;
 if existing is not null and existing<>p_topic then raise exception 'This evidence already has a topic. Refresh before continuing.' using errcode='40001';end if;
 insert into public.execution_topic_attributions(item_id,session_id,workspace_id,user_id,topic_id) values(i.id,i.session_id,w.id,i.user_id,p_topic) on conflict(item_id) do nothing;
end $$;
create function public.assign_execution_topic(p_slug text,p_item uuid,p_topic text) returns void language sql security invoker set search_path='' as $$select private.assign_execution_topic(p_slug,p_item,p_topic)$$;

-- Aggregates metadata only; never transfer code, prompt bodies, notes or reflections.
create function private.mastery_evidence(p_slug text,p_days integer default 90,p_at timestamptz default now()) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;evidence_json jsonb;begin
 w:=private.revision_access(p_slug);
 if p_days not in (7,30,90,365) or p_at>now() or p_at<now()-interval '400 days' then raise exception 'Choose a supported evidence window' using errcode='22023';end if;
 with base as materialized (
 select q.id,q.item_id,q.session_id,q.result,q.confidence,q.duration_ms,q.target_duration_ms,q.pattern_id,q.mistakes,q.completed_at,i.difficulty,i.title,
 coalesce(ri.entity_id,i.id) as learning_id,ta.topic_id,s.mode,
 ra.previous_interval_days is not null as is_revision,ra.previous_interval_days,ra.next_interval_days,
 extract(epoch from p_at-q.completed_at)/86400 as age_days
 from public.question_attempts q join public.execution_session_items i on i.id=q.item_id join public.execution_sessions s on s.id=q.session_id
 left join public.revision_execution_links rl on rl.item_id=i.id left join public.revision_items ri on ri.id=rl.revision_item_id
 left join public.execution_topic_attributions ta on ta.item_id=coalesce(ri.entity_id,i.id)
 left join public.revision_attempts ra on ra.source_attempt_id=q.id
 where q.workspace_id=w.id and q.user_id=(select auth.uid()) and q.reflection_status='completed' and q.completed_at>=p_at-make_interval(days=>p_days) and q.completed_at<=p_at and q.duration_ms>=30000 and s.status in ('completed','expired')
 ),expanded as materialized (
 select b.*,'topic'::text as entity_type,b.topic_id as entity_id from base b where b.topic_id is not null
 union all select b.*,'pattern',b.pattern_id from base b where b.pattern_id is not null
 ),bands as (
 select entity_type,entity_id,case when age_days<=14 then 'recent' when age_days<=45 then 'relevant' when age_days<=90 then 'historical' else 'archive' end as band,
 count(*) filter(where not is_revision) as initial_count,count(*) filter(where not is_revision and result='solved_independently') as initial_independent,
 count(*) filter(where is_revision) as review_count,count(*) filter(where is_revision and result='solved_independently') as review_independent,
 count(*) as total,count(*) filter(where result='solved_small_hint') as minor,count(*) filter(where result='solved_major_hint') as major,count(*) filter(where result='could_not_solve') as failed
 from expanded group by 1,2,3
 ),groups as (
 select e.entity_type,e.entity_id,count(*) as attempts,count(*) filter(where not e.is_revision) as initial_attempts,count(distinct e.learning_id) as distinct_entities,
 count(distinct (e.completed_at at time zone w.timezone)::date) as active_days,min(e.completed_at) as first_at,max(e.completed_at) as last_at,
 count(*) filter(where e.is_revision) as reviews,count(*) filter(where e.is_revision and e.result='solved_independently') as retained,
 count(*) filter(where e.age_days<=14 and e.result='solved_independently') as recent_independent,count(*) filter(where e.age_days<=14 and e.is_revision) as recent_reviews,
 jsonb_build_object('easy',count(*) filter(where difficulty='easy'),'medium',count(*) filter(where difficulty='medium'),'hard',count(*) filter(where difficulty='hard'),'unspecified',count(*) filter(where difficulty='unspecified')) as difficulty,
 jsonb_build_object('count',count(*) filter(where mode='interview' and result='solved_independently' and target_duration_ms>0 and duration_ms::numeric/target_duration_ms between 0.25 and 4),
 'medianRatio',percentile_cont(0.5) within group(order by duration_ms::numeric/nullif(target_duration_ms,0)) filter(where mode='interview' and result='solved_independently' and target_duration_ms>0 and duration_ms::numeric/target_duration_ms between 0.25 and 4),
 'outliers',count(*) filter(where mode='interview' and result='solved_independently' and target_duration_ms>0 and duration_ms::numeric/target_duration_ms not between 0.25 and 4)) as timing,
 percentile_cont(0.5) within group(order by duration_ms) as median_duration_ms,
 jsonb_build_object('recognition',count(*) filter(where 'recognition'=any(mistakes)),'edge_case',count(*) filter(where 'edge_case'=any(mistakes)),'complexity',count(*) filter(where 'complexity'=any(mistakes)),
 'recognition_entities',count(distinct learning_id) filter(where 'recognition'=any(mistakes)),'edge_case_entities',count(distinct learning_id) filter(where 'edge_case'=any(mistakes)),'complexity_entities',count(distinct learning_id) filter(where 'complexity'=any(mistakes))) as reported_mistakes,
 (select jsonb_agg(to_jsonb(b)-'entity_id'-'entity_type') from bands b where b.entity_type=e.entity_type and b.entity_id=e.entity_id) as buckets,
 (select jsonb_agg(to_jsonb(c)) from(select confidence,result,count(*) as count from expanded c where c.entity_type=e.entity_type and c.entity_id=e.entity_id and confidence is not null group by confidence,result) c) as confidence_pairs,
 (select r.id from public.revision_items r join public.execution_topic_attributions a on a.item_id=r.entity_id where r.workspace_id=w.id and r.user_id=(select auth.uid()) and r.state in ('scheduled','snoozed') and r.due_at<=p_at and ((e.entity_type='topic' and a.topic_id=e.entity_id) or (e.entity_type='pattern' and exists(select 1 from public.question_attempts z where z.item_id=r.entity_id and z.pattern_id=e.entity_id))) order by r.due_at,r.id limit 1) as due_revision_id
 from expanded e group by e.entity_type,e.entity_id
 ) select jsonb_build_object('groups',coalesce((select jsonb_agg(to_jsonb(g) order by g.entity_type,g.entity_id) from(select * from groups order by entity_type,entity_id limit 401) g),'[]'),
 'unmapped',jsonb_build_object('count',(select count(distinct learning_id) from base where topic_id is null),'items',coalesce((select jsonb_agg(to_jsonb(u)) from(select distinct on (learning_id) learning_id as item_id,title from base where topic_id is null order by learning_id limit 20) u),'[]')),
 'totals',jsonb_build_object('attempts',(select count(*) from base),'revisions',(select count(*) from base where is_revision),'retained',(select count(*) from base where is_revision and result='solved_independently')),
 'asOf',p_at,'workspaceId',w.id,'userId',(select auth.uid())) into evidence_json;
 return evidence_json;
end $$;
create function public.mastery_evidence(p_slug text,p_days integer default 90,p_at timestamptz default now()) returns jsonb language sql security invoker set search_path='' as $$select private.mastery_evidence(p_slug,p_days,p_at)$$;

create function private.mastery_spine(p_slug text,p_type text,p_entity text,p_before jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;evidence_json jsonb;begin
 w:=private.revision_access(p_slug);
 if p_type not in ('topic','pattern') or length(p_entity)>120 or octet_length(coalesce(p_before::text,''))>500 then raise exception 'Invalid evidence selection' using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(v) order by v.completed_at desc,v.id desc),'[]') into evidence_json from (
 select q.id,q.session_id,q.completed_at,q.result,q.confidence,q.duration_ms,i.title,i.difficulty,ra.previous_interval_days,ra.next_interval_days
 from public.question_attempts q join public.execution_session_items i on i.id=q.item_id
 left join public.revision_execution_links rl on rl.item_id=i.id left join public.revision_items ri on ri.id=rl.revision_item_id
 left join public.execution_topic_attributions a on a.item_id=coalesce(ri.entity_id,i.id) left join public.revision_attempts ra on ra.source_attempt_id=q.id
 where q.workspace_id=w.id and q.user_id=(select auth.uid()) and q.reflection_status='completed' and q.duration_ms>=30000 and ((p_type='topic' and a.topic_id=p_entity) or (p_type='pattern' and q.pattern_id=p_entity))
 and (p_before is null or (q.completed_at,q.id)<((p_before->>'at')::timestamptz,(p_before->>'id')::uuid)) order by q.completed_at desc,q.id desc limit 31
 ) v;return evidence_json;
end $$;
create function public.mastery_spine(p_slug text,p_type text,p_entity text,p_before jsonb default null) returns jsonb language sql security invoker set search_path='' as $$select private.mastery_spine(p_slug,p_type,p_entity,p_before)$$;
create index mastery_completed_evidence on public.question_attempts(workspace_id,user_id,completed_at desc,id desc) where reflection_status='completed' and duration_ms>=30000;
do $$declare sig text;begin
 foreach sig in array array['assign_execution_topic(text,uuid,text)','mastery_evidence(text,integer,timestamptz)','mastery_spine(text,text,text,jsonb)'] loop
 execute 'revoke all on function private.'||sig||' from public,anon,service_role';execute 'grant execute on function private.'||sig||' to authenticated';
 execute 'revoke all on function public.'||sig||' from public,anon,service_role';execute 'grant execute on function public.'||sig||' to authenticated';end loop;end $$;

-- Explicit curriculum attribution is optional and atomic with a new Execution launch.
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
    if nullif(prompt->>'topicId','') is not null then
      perform private.assign_execution_topic(p_slug,item_id,prompt->>'topicId');
    end if;
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

