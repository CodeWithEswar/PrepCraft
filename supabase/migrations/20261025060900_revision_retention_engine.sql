-- Revision owns schedules, not question content or execution timing.
create table public.revision_items (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, entity_type text not null default 'execution_prompt' check(entity_type='execution_prompt'),
 entity_id uuid not null, origin_session_id uuid not null,
 state text not null default 'scheduled' check(state in ('scheduled','snoozed','retired','archived')),
 due_at timestamptz not null, interval_days integer not null check(interval_days in (1,3,7,14,30)),
 policy_version text not null default 'revision-policy-v1' check(policy_version='revision-policy-v1'), schedule_reason text not null,
 last_reviewed_at timestamptz not null,last_outcome text not null check(last_outcome in ('independent_success','minor_assistance','major_assistance','failed_recall')),
 review_count integer not null default 0 check(review_count>=0),failure_count integer not null default 0 check(failure_count>=0),
 independent_streak integer not null default 0 check(independent_streak>=0),snooze_count integer not null default 0 check(snooze_count>=0),version integer not null default 0 check(version>=0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(id,workspace_id,user_id), unique(workspace_id,user_id,entity_type,entity_id),
 foreign key(entity_id,origin_session_id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) on delete cascade
);
create index revision_owner_due on public.revision_items(workspace_id,user_id,due_at,id) where state in ('scheduled','snoozed');
create index revision_origin on public.revision_items(entity_id,origin_session_id);
create table public.revision_attempts (
 id uuid primary key default gen_random_uuid(),revision_item_id uuid not null,workspace_id uuid not null,user_id uuid not null,
 source_attempt_id uuid not null unique,reviewed_at timestamptz not null,outcome text not null check(outcome in ('independent_success','minor_assistance','major_assistance','failed_recall')),
 confidence integer check(confidence between 1 and 5),duration_ms bigint not null check(duration_ms>=0),hint_level integer not null check(hint_level between 0 and 3),
 previous_interval_days integer, next_interval_days integer not null check(next_interval_days in (1,3,7,14,30)),previous_due_at timestamptz,next_due_at timestamptz not null,
 policy_version text not null,schedule_reason text not null,created_at timestamptz not null default now(),
 foreign key(revision_item_id,workspace_id,user_id) references public.revision_items(id,workspace_id,user_id) on delete cascade,
 foreign key(source_attempt_id,workspace_id,user_id) references public.question_attempts(id,workspace_id,user_id) on delete cascade
);
create index revision_attempt_thread on public.revision_attempts(revision_item_id,reviewed_at desc,id desc);
create index revision_attempt_owner on public.revision_attempts(workspace_id,user_id,reviewed_at desc,id desc);
create table public.revision_snoozes (
 id uuid primary key default gen_random_uuid(),revision_item_id uuid not null,workspace_id uuid not null,user_id uuid not null,
 previous_due_at timestamptz not null,previous_state text not null, snoozed_until timestamptz not null,reason text not null default '' check(length(reason)<=500),
 created_at timestamptz not null default now(),undone_at timestamptz,
 foreign key(revision_item_id,workspace_id,user_id) references public.revision_items(id,workspace_id,user_id) on delete cascade
);
create index revision_snooze_thread on public.revision_snoozes(revision_item_id,created_at desc);
create index revision_snooze_owner on public.revision_snoozes(workspace_id,user_id);
create table public.revision_execution_links (
 item_id uuid primary key,session_id uuid not null,revision_item_id uuid not null,workspace_id uuid not null,user_id uuid not null,
 foreign key(item_id,session_id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) on delete cascade,
 foreign key(revision_item_id,workspace_id,user_id) references public.revision_items(id,workspace_id,user_id) on delete cascade
);
create index revision_link_item on public.revision_execution_links(revision_item_id);
create index revision_link_owner on public.revision_execution_links(workspace_id,user_id,session_id);
create table public.revision_events (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null,user_id uuid not null,revision_item_id uuid not null,
 request_id uuid not null,request_hash text not null,event_type text not null check(event_type in ('scheduled','reviewed','snoozed','unsnoozed','retired','restored','started')),
 payload jsonb not null default '{}',created_at timestamptz not null default now(), unique(workspace_id,user_id,request_id),
 foreign key(revision_item_id,workspace_id,user_id) references public.revision_items(id,workspace_id,user_id) on delete cascade
);
create index revision_events_owner on public.revision_events(workspace_id,user_id,created_at desc);
create index revision_events_item on public.revision_events(revision_item_id);
do $$declare t text;begin
 foreach t in array array['revision_items','revision_attempts','revision_snoozes','revision_execution_links','revision_events'] loop
 execute format('alter table public.%I enable row level security',t);execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);
 execute format('create policy revision_owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()) and public.is_workspace_member(workspace_id))',t);
 end loop;
end $$;

-- Central database policy, mirrored by the portable domain policy and parity-tested.
create function private.revision_interval(p_previous integer,p_outcome text) returns integer language sql immutable set search_path='' as $$
 select case when p_previous is null then 1 when p_outcome='independent_success' then case p_previous when 1 then 3 when 3 then 7 when 7 then 14 else 30 end
 when p_outcome='minor_assistance' then p_previous when p_outcome='major_assistance' then case p_previous when 30 then 14 when 14 then 7 when 7 then 3 else 1 end else 1 end
$$;
revoke all on function private.revision_interval(integer,text) from public,anon,authenticated,service_role;
create function private.consume_revision_attempt(p_attempt uuid) returns uuid language plpgsql security definer set search_path='' as $$
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
revoke all on function private.consume_revision_attempt(uuid) from public,anon,authenticated,service_role;
create function private.revision_attempt_committed() returns trigger language plpgsql security definer set search_path='' as $$begin
 perform private.consume_revision_attempt(new.attempt_id);return new;end $$;
revoke all on function private.revision_attempt_committed() from public,anon,authenticated,service_role;
create trigger revision_on_attempt_committed after insert on public.attempt_outbox_events for each row execute function private.revision_attempt_committed();

create function private.revision_pressure(p_due timestamptz,p_outcome text,p_failures integer,p_snoozes integer,p_now timestamptz) returns numeric language sql immutable set search_path='' as $$
 select case when p_due>p_now then -100 else 0 end+least(1,greatest(0,extract(epoch from p_now-p_due)/86400)/14)*40
 +case p_outcome when 'failed_recall' then 30 when 'major_assistance' then 22 when 'minor_assistance' then 12 else 0 end
 +least(p_failures,3)*4+least(p_snoozes,3)*2
$$;
revoke all on function private.revision_pressure(timestamptz,text,integer,integer,timestamptz) from public,anon,authenticated,service_role;
create function private.revision_access(p_slug text,p_write boolean default false) returns public.workspaces language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;begin
 if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501';end if;
 select * into w from public.workspaces where slug=p_slug;
 if w.id is null or not exists(select 1 from public.workspace_members where workspace_id=w.id and user_id=(select auth.uid()) and status='active') or (p_write and w.status<>'active') then raise exception 'Workspace unavailable or read-only' using errcode='42501';end if;return w;
end $$;
revoke all on function private.revision_access(text,boolean) from public,anon,authenticated,service_role;
-- Bounded reconciliation covers pre-existing committed attempts; new evidence is synchronous.
create function private.reconcile_revision(p_slug text) returns integer language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;a record;n integer:=0;begin
 w:=private.revision_access(p_slug,true);
 for a in select q.id from public.question_attempts q where q.workspace_id=w.id and q.user_id=(select auth.uid()) and q.reflection_status='completed' and not exists(select 1 from public.revision_attempts r where r.source_attempt_id=q.id) order by q.completed_at,q.id limit 100 loop
 perform private.consume_revision_attempt(a.id);n:=n+1;end loop;return n;
end $$;
create function public.reconcile_revision(p_slug text) returns integer language sql security invoker set search_path='' as $$select private.reconcile_revision(p_slug)$$;

create function private.revision_queue(p_slug text,p_filters jsonb default '{}',p_cursor jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;rows jsonb;summary jsonb;horizon jsonb;horizon_state text:='ready';today date;begin
 w:=private.revision_access(p_slug);today:=(now() at time zone w.timezone)::date;
 if octet_length(p_filters::text)>2000 or length(coalesce(p_filters->>'search',''))>120 then raise exception 'Invalid filters' using errcode='22023';end if;
 select jsonb_build_object('total',count(*),'due',count(*) filter(where r.due_at<=now()),'overdue',count(*) filter(where (r.due_at at time zone w.timezone)::date<today),
 'upcoming',count(*) filter(where r.due_at>now()),'knownMinutes',sum(case when a.duration_ms>0 then ceil(a.duration_ms/60000.0) else 0 end) filter(where r.due_at<=now()),
 'unknownDurations',count(*) filter(where r.due_at<=now() and coalesce(a.duration_ms,0)=0),
 'reinforcement',count(*) filter(where r.last_outcome in ('major_assistance','failed_recall')),'developing',count(*) filter(where r.last_outcome not in ('major_assistance','failed_recall') and r.independent_streak<2),
 'stable',count(*) filter(where r.independent_streak between 2 and 3),'strong',count(*) filter(where r.independent_streak>=4)) into summary
 from public.revision_items r left join lateral(select duration_ms from public.revision_attempts where revision_item_id=r.id order by reviewed_at desc,id desc limit 1) a on true
 where r.workspace_id=w.id and r.user_id=(select auth.uid()) and r.state in ('scheduled','snoozed');
 select coalesce(jsonb_agg(to_jsonb(v) order by v.rank desc,v.due_at,v.id),'[]') into rows from (
 select r.*,i.title,i.topic,i.difficulty,private.revision_pressure(r.due_at,r.last_outcome,r.failure_count,r.snooze_count,coalesce((p_cursor->>'asOf')::timestamptz,now())) as rank,
 a.duration_ms as estimated_duration_ms,
 (select s.id from public.revision_execution_links l join public.execution_sessions s on s.id=l.session_id where l.revision_item_id=r.id and (s.status in ('active','paused') or exists(select 1 from public.question_attempts q where q.item_id=l.item_id and q.reflection_status='pending')) order by s.started_at desc limit 1) as active_session_id
 from public.revision_items r join public.execution_session_items i on i.id=r.entity_id
 left join lateral(select duration_ms from public.revision_attempts where revision_item_id=r.id order by reviewed_at desc,id desc limit 1) a on true
 where r.workspace_id=w.id and r.user_id=(select auth.uid())
 and (case when p_filters->>'state'='retired' then r.state='retired' else r.state in ('scheduled','snoozed') end)
 and (coalesce(p_filters->>'search','')='' or strpos(lower(i.title||' '||i.topic),lower(p_filters->>'search'))>0)
 and (coalesce(p_filters->>'outcome','all')='all' or r.last_outcome=p_filters->>'outcome')
 and (coalesce(p_filters->>'difficulty','all')='all' or i.difficulty=p_filters->>'difficulty')
 and (coalesce(p_filters->>'topic','')='' or i.topic=p_filters->>'topic')
 and (coalesce(p_filters->>'state','all') in ('all','retired') or (p_filters->>'state'='due' and r.due_at<=now()) or (p_filters->>'state'='overdue' and (r.due_at at time zone w.timezone)::date<today) or (p_filters->>'state'='upcoming' and r.due_at>now()))
 and (p_cursor is null or (-private.revision_pressure(r.due_at,r.last_outcome,r.failure_count,r.snooze_count,(p_cursor->>'asOf')::timestamptz),r.due_at,r.id) > (-(p_cursor->>'rank')::numeric,(p_cursor->>'due')::timestamptz,(p_cursor->>'id')::uuid))
 order by private.revision_pressure(r.due_at,r.last_outcome,r.failure_count,r.snooze_count,coalesce((p_cursor->>'asOf')::timestamptz,now())) desc,r.due_at,r.id limit 41
 ) v;
 begin
 select coalesce(jsonb_agg(to_jsonb(d) order by d.day),'[]') into horizon from (
 select greatest(today,(r.due_at at time zone w.timezone)::date) as day,count(*) as count,
 coalesce(sum(ceil(a.duration_ms/60000.0)) filter(where a.duration_ms>0),0) as known_minutes,count(*) filter(where coalesce(a.duration_ms,0)=0) as unknown_durations
 from public.revision_items r left join lateral(select duration_ms from public.revision_attempts where revision_item_id=r.id order by reviewed_at desc,id desc limit 1) a on true
 where r.workspace_id=w.id and r.user_id=(select auth.uid()) and r.state in ('scheduled','snoozed') and (r.due_at at time zone w.timezone)::date<today+30 group by 1) d;
 exception when others then horizon:='[]'::jsonb;horizon_state:='error';end;
 return jsonb_build_object('items',rows,'summary',summary,'horizon',horizon,'horizonState',horizon_state,'asOf',coalesce(p_cursor->>'asOf',now()::text),'serverNow',now(),'workspace',jsonb_build_object('id',w.id,'slug',w.slug,'timezone',w.timezone,'userId',(select auth.uid()),'canEdit',w.status='active'));
end $$;
create function public.revision_queue(p_slug text,p_filters jsonb default '{}',p_cursor jsonb default null) returns jsonb language sql security invoker set search_path='' as $$select private.revision_queue(p_slug,p_filters,p_cursor)$$;

create function private.revision_detail(p_slug text,p_item uuid,p_before timestamptz default null,p_before_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;r public.revision_items%rowtype;begin
 w:=private.revision_access(p_slug);select * into r from public.revision_items where id=p_item and workspace_id=w.id and user_id=(select auth.uid());
 if r.id is null then raise exception 'Revision unavailable' using errcode='42501';end if;
 return jsonb_build_object('item',to_jsonb(r)||(select jsonb_build_object('title',title,'topic',topic,'difficulty',difficulty) from public.execution_session_items where id=r.entity_id),
 'history',coalesce((select jsonb_agg(to_jsonb(v) order by v.reviewed_at desc,v.id desc) from(select * from public.revision_attempts where revision_item_id=r.id and (p_before is null or (reviewed_at,id)<(p_before,coalesce(p_before_id,'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))) order by reviewed_at desc,id desc limit 30) v),'[]'),
 'snoozes',coalesce((select jsonb_agg(to_jsonb(v) order by v.created_at desc) from(select * from public.revision_snoozes where revision_item_id=r.id order by created_at desc limit 20) v),'[]'),
 'evidence',(select jsonb_build_object('independent',count(*) filter(where outcome='independent_success'),'assisted',count(*) filter(where outcome in ('minor_assistance','major_assistance')),'failed',count(*) filter(where outcome='failed_recall')) from public.revision_attempts where revision_item_id=r.id),
 'serverNow',now(),'timezone',w.timezone);
end $$;
create function public.revision_detail(p_slug text,p_item uuid,p_before timestamptz default null,p_before_id uuid default null) returns jsonb language sql security invoker set search_path='' as $$select private.revision_detail(p_slug,p_item,p_before,p_before_id)$$;

create function private.mutate_revision(p_slug text,p_item uuid,p_version integer,p_request uuid,p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;r public.revision_items%rowtype;e public.revision_events%rowtype;sn public.revision_snoozes%rowtype;origin public.execution_session_items%rowtype;response jsonb;prompt jsonb;sid uuid;iid uuid;until_at timestamptz;action text:=p_command->>'kind';payload jsonb:='{}';actor uuid:=(select auth.uid());begin
 w:=private.revision_access(p_slug,true);perform 1 from public.workspaces where id=w.id for update;
 select * into r from public.revision_items where id=p_item and workspace_id=w.id and user_id=actor for update;
 if r.id is null then raise exception 'Revision unavailable' using errcode='42501';end if;
 if p_request is null or p_command is null or octet_length(p_command::text)>4000 then raise exception 'Invalid revision request' using errcode='22023';end if;
 select * into e from public.revision_events where workspace_id=w.id and user_id=actor and request_id=p_request;
 if e.id is not null then if e.request_hash<>md5(p_command::text)||':'||p_item::text then raise exception 'Request changed' using errcode='40001';end if;return e.payload;end if;
 if r.version<>p_version then raise exception 'This revision changed. Refresh before trying again.' using errcode='40001';end if;
 if action='restore' and r.state='retired' then update public.revision_items set state='scheduled',version=version+1,updated_at=now() where id=r.id;
 elsif r.state not in ('scheduled','snoozed') then raise exception 'This revision is inactive' using errcode='22023';
 elsif action='start' then
  if r.due_at>now() then raise exception 'This review is not due yet' using errcode='22023';end if;
  select s.id into sid from public.revision_execution_links l join public.execution_sessions s on s.id=l.session_id where l.revision_item_id=r.id and (s.status in ('active','paused') or exists(select 1 from public.question_attempts q where q.item_id=l.item_id and q.reflection_status='pending')) order by s.started_at desc limit 1;
  if sid is not null then return jsonb_build_object('sessionId',sid,'resumed',true);end if;
  select * into origin from public.execution_session_items where id=r.entity_id;
  prompt:=jsonb_build_object('title',origin.title,'body',origin.body,'topic',origin.topic,'difficulty',origin.difficulty,'constraints',origin.constraints_text,'examples',origin.examples,'hints',coalesce((select jsonb_agg(jsonb_build_object('title',h.title,'body',h.body) order by h.level) from public.execution_item_hints h where h.item_id=origin.id),'[]'));
  response:=private.create_execution(p_slug,p_request,jsonb_build_object('mode','practice','source','manual','targetSeconds',null,'prompts',jsonb_build_array(prompt)));
  sid:=(response->'data'->'session'->>'id')::uuid;
  if not (response->>'ok')::boolean then return jsonb_build_object('sessionId',sid,'otherActive',true);end if;
  iid:=(response->'data'->'items'->0->>'id')::uuid;
  update public.execution_sessions set task_type='revision' where id=sid;
  insert into public.revision_execution_links(item_id,session_id,revision_item_id,workspace_id,user_id) values(iid,sid,r.id,w.id,actor);
  payload:=jsonb_build_object('sessionId',sid);update public.revision_items set version=version+1,updated_at=now() where id=r.id;
 elsif exists(select 1 from public.revision_execution_links l join public.execution_sessions s on s.id=l.session_id where l.revision_item_id=r.id and (s.status in ('active','paused') or exists(select 1 from public.question_attempts q where q.item_id=l.item_id and q.reflection_status='pending'))) then raise exception 'Finish the active review and reflection first' using errcode='40001';
 elsif action='snooze' then
  until_at:=(p_command->>'until')::timestamptz;
  if until_at is null or until_at<=greatest(now(),r.due_at) or until_at>now()+interval '30 days' or length(coalesce(p_command->>'reason',''))>500 then raise exception 'Choose a later date within 30 days' using errcode='22023';end if;
  insert into public.revision_snoozes(revision_item_id,workspace_id,user_id,previous_due_at,previous_state,snoozed_until,reason) values(r.id,w.id,actor,r.due_at,r.state,until_at,coalesce(p_command->>'reason','')) returning * into sn;
  update public.revision_items set state='snoozed',due_at=until_at,snooze_count=snooze_count+1,version=version+1,updated_at=now() where id=r.id;
  payload:=jsonb_build_object('snoozeId',sn.id);
 elsif action='undo_snooze' then
  select * into sn from public.revision_snoozes where id=(p_command->>'snoozeId')::uuid and revision_item_id=r.id for update;
  if sn.id is null or sn.undone_at is not null or sn.created_at<now()-interval '5 minutes' or r.due_at<>sn.snoozed_until then raise exception 'This snooze can no longer be undone' using errcode='40001';end if;
  update public.revision_snoozes set undone_at=now() where id=sn.id;
  update public.revision_items set due_at=sn.previous_due_at,state=sn.previous_state,snooze_count=greatest(0,snooze_count-1),version=version+1,updated_at=now() where id=r.id;
 elsif action='retire' then update public.revision_items set state='retired',version=version+1,updated_at=now() where id=r.id;
 else raise exception 'Unknown revision action' using errcode='22023';end if;
 insert into public.revision_events(workspace_id,user_id,revision_item_id,request_id,request_hash,event_type,payload)
 values(w.id,actor,r.id,p_request,md5(p_command::text)||':'||p_item::text,case action when 'start' then 'started' when 'snooze' then 'snoozed' when 'undo_snooze' then 'unsnoozed' when 'restore' then 'restored' else 'retired' end,payload);
 return payload;
end $$;
create function public.mutate_revision(p_slug text,p_item uuid,p_version integer,p_request uuid,p_command jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.mutate_revision(p_slug,p_item,p_version,p_request,p_command)$$;
do $$declare sig text;begin
 foreach sig in array array['reconcile_revision(text)','revision_queue(text,jsonb,jsonb)','revision_detail(text,uuid,timestamptz,uuid)','mutate_revision(text,uuid,integer,uuid,jsonb)'] loop
 execute 'revoke all on function private.'||sig||' from public,anon,service_role';execute 'grant execute on function private.'||sig||' to authenticated';
 execute 'revoke all on function public.'||sig||' from public,anon,service_role';execute 'grant execute on function public.'||sig||' to authenticated';end loop;end $$;

-- Execution exposes committed scheduling results, never predictions.
create or replace function private.execution_snapshot(p_session uuid) returns jsonb language sql security definer set search_path='' as $$
select jsonb_build_object(
  'revisionContext',(select jsonb_build_object('id',r.id,'intervalDays',r.interval_days,'lastOutcome',r.last_outcome,'lastReviewedAt',r.last_reviewed_at) from public.revision_execution_links l join public.revision_items r on r.id=l.revision_item_id where l.session_id=s.id limit 1),'session',to_jsonb(s),'serverNow',now(),
  'workspace',jsonb_build_object('id',w.id,'slug',w.slug,'name',w.name,'timezone',w.timezone),
  'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('hints',coalesce((select jsonb_agg(jsonb_build_object('level',h.level,'title',h.title,'body',h.body,'revealed_at',u.revealed_at) order by h.level) from public.execution_item_hints h join public.execution_hint_uses u on u.item_id=h.item_id and u.level=h.level where h.item_id=i.id),'[]'::jsonb)) order by i.position) from public.execution_session_items i where i.session_id=s.id),'[]'::jsonb),
  'attempts',coalesce((select jsonb_agg(to_jsonb(a)||jsonb_build_object('revision_schedule',(select jsonb_build_object('itemId',r.revision_item_id,'intervalDays',r.next_interval_days,'previousIntervalDays',r.previous_interval_days,'dueAt',r.next_due_at,'reason',r.schedule_reason,'policy',r.policy_version) from public.revision_attempts r where r.source_attempt_id=a.id)) order by a.created_at,a.id) from public.question_attempts a where a.session_id=s.id),'[]'::jsonb),
  'events',coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at,e.id) from public.execution_events e where e.session_id=s.id and e.event_type not in ('draft_saved','debrief_draft')),'[]'::jsonb),
  'patterns',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name) order by p.name) from public.patterns p),'[]'::jsonb)
) from public.execution_sessions s join public.workspaces w on w.id=s.workspace_id where s.id=p_session
$$;
