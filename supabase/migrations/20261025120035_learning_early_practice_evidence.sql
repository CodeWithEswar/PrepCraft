-- Early repeats retain their source attempt/history but cannot manufacture spaced recall.
create or replace function private.consume_revision_attempt(p_attempt uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.question_attempts%rowtype;r public.revision_items%rowtype;origin public.execution_session_items%rowtype;linked uuid;outcome text;days integer;next_due timestamptz;zone text;reason text;hint integer;
begin
 select * into a from public.question_attempts where id=p_attempt for update;
 if a.id is null or a.reflection_status<>'completed' then return null;end if;
 select revision_item_id into linked from public.revision_attempts where source_attempt_id=a.id;
 if linked is not null then return linked;end if;
 select timezone into zone from public.workspaces where id=a.workspace_id;
 select revision_item_id into linked from public.revision_execution_links where item_id=a.item_id and workspace_id=a.workspace_id and user_id=a.user_id;
 if linked is not null then select * into r from public.revision_items where id=linked for update;
 else
   select * into origin from public.execution_session_items where id=a.item_id and workspace_id=a.workspace_id and user_id=a.user_id;
   -- Serialize first evidence for this canonical prompt identity; never merge by title.
   perform pg_advisory_xact_lock(hashtextextended(a.item_id::text,0));
   select * into r from public.revision_items where workspace_id=a.workspace_id and user_id=a.user_id and entity_id=a.item_id for update;
 end if;
 outcome:=case a.result when 'solved_independently' then 'independent_success' when 'solved_small_hint' then 'minor_assistance' when 'solved_major_hint' then 'major_assistance' else 'failed_recall' end;

 -- Repeating an exposed assessment before its recall date is practice, not spaced recall.
 if linked is not null and r.due_at>a.completed_at and exists(select 1 from public.learning_execution_bindings b where b.item_id=a.item_id and b.submitted_at is not null) then
  days:=case when outcome='failed_recall' then 1 else r.interval_days end;
  next_due:=case when outcome='failed_recall' then least(r.due_at,(((a.completed_at at time zone zone)::date+1)+time '09:00') at time zone zone) else r.due_at end;
  reason:='EARLY_PRACTICE_NO_ADVANCE';
  insert into public.revision_attempts(revision_item_id,workspace_id,user_id,source_attempt_id,reviewed_at,outcome,confidence,duration_ms,hint_level,previous_interval_days,next_interval_days,previous_due_at,next_due_at,policy_version,schedule_reason)
  values(r.id,a.workspace_id,a.user_id,a.id,a.completed_at,outcome,a.confidence,a.duration_ms,0,r.interval_days,days,r.due_at,next_due,'revision-policy-v1',reason);
  if outcome='failed_recall' then
   update public.revision_items set due_at=next_due,interval_days=days,schedule_reason=reason,last_outcome=outcome,last_reviewed_at=a.completed_at,failure_count=failure_count+1,independent_streak=0,version=version+1,updated_at=now() where id=r.id;
  end if;
  insert into public.revision_events(workspace_id,user_id,revision_item_id,request_id,request_hash,event_type,payload)
  values(a.workspace_id,a.user_id,r.id,a.id,'revision-policy-v1','reviewed',jsonb_build_object('attemptId',a.id,'nextInterval',days,'nextDue',next_due,'policy','revision-policy-v1','reason',reason));
  return r.id;
 end if;
 days:=private.revision_interval(r.interval_days,outcome);
 reason:=case when r.id is null then 'INITIAL_REVIEW' when outcome='independent_success' and r.interval_days=30 then 'MAINTENANCE_30' when outcome='independent_success' then 'INDEPENDENT_ADVANCE' when outcome='minor_assistance' then 'ASSISTED_HOLD' when outcome='major_assistance' then 'ASSISTED_SHORTER' else 'FAILED_RESET' end;
 next_due:=(((a.completed_at at time zone zone)::date+days)+time '09:00') at time zone zone;
 if r.id is not null and a.completed_at<r.last_reviewed_at then days:=r.interval_days;next_due:=r.due_at;reason:='LATE_EVIDENCE_NO_CHANGE';end if;
 hint:=coalesce((select max(level) from public.execution_hint_uses where item_id=a.item_id),0);
 if r.id is null then
  insert into public.revision_items(workspace_id,user_id,entity_id,origin_session_id,due_at,interval_days,schedule_reason,last_reviewed_at,last_outcome,failure_count,independent_streak)
  values(a.workspace_id,a.user_id,a.item_id,a.session_id,next_due,days,reason,a.completed_at,outcome,case when outcome='failed_recall' then 1 else 0 end,case when outcome='independent_success' then 1 else 0 end) returning * into r;
  insert into public.revision_attempts(revision_item_id,workspace_id,user_id,source_attempt_id,reviewed_at,outcome,confidence,duration_ms,hint_level,next_interval_days,next_due_at,policy_version,schedule_reason)
  values(r.id,a.workspace_id,a.user_id,a.id,a.completed_at,outcome,a.confidence,a.duration_ms,hint,days,next_due,'revision-policy-v1',reason);
 else
  insert into public.revision_attempts(revision_item_id,workspace_id,user_id,source_attempt_id,reviewed_at,outcome,confidence,duration_ms,hint_level,previous_interval_days,next_interval_days,previous_due_at,next_due_at,policy_version,schedule_reason)
  values(r.id,a.workspace_id,a.user_id,a.id,a.completed_at,outcome,a.confidence,a.duration_ms,hint,r.interval_days,days,r.due_at,next_due,'revision-policy-v1',reason);
  -- Late deliveries remain historical evidence and cannot overwrite a newer schedule.
  if a.completed_at>=r.last_reviewed_at then
   update public.revision_items set due_at=next_due,interval_days=days,schedule_reason=reason,last_reviewed_at=a.completed_at,last_outcome=outcome,
   review_count=review_count+1,failure_count=failure_count+case when outcome='failed_recall' then 1 else 0 end,independent_streak=case when outcome='independent_success' then independent_streak+1 else 0 end,
   state=case when state in ('retired','archived') then state else 'scheduled' end,version=version+1,updated_at=now() where id=r.id;
  end if;
 end if;
 insert into public.revision_events(workspace_id,user_id,revision_item_id,request_id,request_hash,event_type,payload)
 values(a.workspace_id,a.user_id,r.id,a.id,'revision-policy-v1',case when reason='INITIAL_REVIEW' then 'scheduled' else 'reviewed' end,jsonb_build_object('attemptId',a.id,'nextInterval',days,'nextDue',next_due,'policy','revision-policy-v1')) on conflict do nothing;
 return r.id;
end $$;

create or replace function private.mastery_evidence(p_slug text,p_days integer default 90,p_at timestamptz default now()) returns jsonb language plpgsql security definer set search_path='' as $$
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
 where q.workspace_id=w.id and q.user_id=(select auth.uid()) and q.reflection_status='completed' and not exists(select 1 from public.revision_attempts early where early.source_attempt_id=q.id and early.schedule_reason='EARLY_PRACTICE_NO_ADVANCE') and q.completed_at>=p_at-make_interval(days=>p_days) and q.completed_at<=p_at and (q.duration_ms>=30000 or exists(select 1 from public.learning_execution_bindings lb where lb.item_id=q.item_id and lb.submitted_at is not null)) and s.status in ('completed','expired')
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
 'areas',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'trackId',t.track_id,'trackName',tr.name)) from public.learning_topic_catalog lc join public.topics t on t.id=lc.topic_id join public.tracks tr on tr.id=t.track_id where private.execution_topic_allowed(w.id,t.id)),'[]'),'asOf',p_at,'workspaceId',w.id,'userId',(select auth.uid())) into evidence_json;
 return evidence_json;
end $$;

create or replace function private.mastery_spine(p_slug text,p_type text,p_entity text,p_before jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;evidence_json jsonb;begin
 w:=private.revision_access(p_slug);
 if p_type not in ('topic','pattern') or length(p_entity)>120 or octet_length(coalesce(p_before::text,''))>500 then raise exception 'Invalid evidence selection' using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(v) order by v.completed_at desc,v.id desc),'[]') into evidence_json from (
 select q.id,q.session_id,q.completed_at,q.result,q.confidence,q.duration_ms,i.title,i.difficulty,ra.previous_interval_days,ra.next_interval_days
 from public.question_attempts q join public.execution_session_items i on i.id=q.item_id
 left join public.revision_execution_links rl on rl.item_id=i.id left join public.revision_items ri on ri.id=rl.revision_item_id
 left join public.execution_topic_attributions a on a.item_id=coalesce(ri.entity_id,i.id) left join public.revision_attempts ra on ra.source_attempt_id=q.id
 where q.workspace_id=w.id and q.user_id=(select auth.uid()) and q.reflection_status='completed' and not exists(select 1 from public.revision_attempts early where early.source_attempt_id=q.id and early.schedule_reason='EARLY_PRACTICE_NO_ADVANCE') and (q.duration_ms>=30000 or exists(select 1 from public.learning_execution_bindings lb where lb.item_id=q.item_id and lb.submitted_at is not null)) and ((p_type='topic' and a.topic_id=p_entity) or (p_type='pattern' and q.pattern_id=p_entity))
 and (p_before is null or (q.completed_at,q.id)<((p_before->>'at')::timestamptz,(p_before->>'id')::uuid)) order by q.completed_at desc,q.id desc limit 31
 ) v;return evidence_json;
end $$;
