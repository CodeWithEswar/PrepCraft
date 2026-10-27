-- Versioned frameworks configure a user-owned story portfolio; Execution owns all timing.
create table public.behavioral_frameworks(id text not null,version integer not null check(version>0),name text not null check(length(name) between 1 and 120),description text not null default '',source_type text not null check(source_type in ('platform','company_template','workspace_custom')),workspace_id uuid references public.workspaces(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,status text not null default 'published' check(status in ('draft','published','deprecated','archived')),source_reference text,primary key(id,version),check((source_type='workspace_custom')=(workspace_id is not null and user_id is not null)));
create index behavioral_framework_owner on public.behavioral_frameworks(workspace_id,user_id);
create table public.behavioral_principles(id text primary key,framework_id text not null,framework_version integer not null,name text not null check(length(name) between 1 and 120),description text not null check(length(description)<=2000),guidance text not null check(length(guidance)<=2000),common_mistake text not null check(length(common_mistake)<=1000),sort_order integer not null,priority text not null default 'medium' check(priority in ('high','medium','low')),foreign key(framework_id,framework_version) references public.behavioral_frameworks(id,version),unique(framework_id,framework_version,name));
create index behavioral_principle_framework on public.behavioral_principles(framework_id,framework_version,sort_order,id);
create table public.behavioral_prompts(id text primary key,framework_id text not null,framework_version integer not null,prompt text not null check(length(prompt) between 10 and 2000),category text not null,difficulty text not null default 'standard' check(difficulty in ('foundation','standard','stretch')),follow_ups jsonb not null default '[]' check(jsonb_typeof(follow_ups)='array' and jsonb_array_length(follow_ups)<=8 and octet_length(follow_ups::text)<=6000),version integer not null default 1,status text not null default 'published' check(status in ('draft','published','deprecated','archived')),foreign key(framework_id,framework_version) references public.behavioral_frameworks(id,version));
create index behavioral_prompt_framework on public.behavioral_prompts(framework_id,framework_version,status,id);
create table public.behavioral_prompt_principles(prompt_id text not null references public.behavioral_prompts(id),principle_id text not null references public.behavioral_principles(id),primary key(prompt_id,principle_id));
create index behavioral_prompt_principle on public.behavioral_prompt_principles(principle_id,prompt_id);
create table public.template_behavioral_frameworks(template_id text not null,template_version integer not null,framework_id text not null,framework_version integer not null,primary key(template_id,template_version),foreign key(template_id,template_version) references public.preparation_template_versions(template_id,version_number),foreign key(framework_id,framework_version) references public.behavioral_frameworks(id,version));
create index template_behavioral_framework on public.template_behavioral_frameworks(framework_id,framework_version);
create table public.workspace_behavioral_settings(workspace_id uuid not null references public.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,framework_id text not null,framework_version integer not null,version integer not null default 0,primary key(workspace_id,user_id),foreign key(framework_id,framework_version) references public.behavioral_frameworks(id,version));
create index behavioral_settings_framework on public.workspace_behavioral_settings(framework_id,framework_version);
create table public.star_stories(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,title text not null check(length(btrim(title)) between 1 and 160),summary text not null default '' check(length(summary)<=500),situation text not null default '' check(length(situation)<=6000),task text not null default '' check(length(task)<=4000),action text not null default '' check(length(action)<=10000),result text not null default '' check(length(result)<=6000),reflection text not null default '' check(length(reflection)<=4000),private_notes text not null default '' check(length(private_notes)<=4000),context text not null default '' check(length(context)<=300),period text not null default '' check(length(period)<=100),story_type text check(story_type in ('project','internship','academic','leadership','team','personal_project','open_source','volunteering','other')),status text not null default 'draft' check(status in ('draft','developing','practice_ready','retired')),version integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),retired_at timestamptz,unique(id,workspace_id,user_id),check((status='retired')=(retired_at is not null)),check(status<>'practice_ready' or (length(btrim(situation))>0 and length(btrim(task))>0 and length(btrim(action))>0 and length(btrim(result))>0)));
create index story_owner_library on public.star_stories(workspace_id,user_id,updated_at desc,id desc);
create index story_owner_status on public.star_stories(workspace_id,user_id,status);
create index story_search on public.star_stories using gin(to_tsvector('english',title||' '||summary||' '||context));
create table public.star_story_principles(story_id uuid not null,workspace_id uuid not null,user_id uuid not null,principle_id text not null references public.behavioral_principles(id),relevance text not null check(relevance in ('primary','strong','supporting')),is_primary boolean not null default false,notes text not null default '' check(length(notes)<=1000),primary key(story_id,principle_id),foreign key(story_id,workspace_id,user_id) references public.star_stories(id,workspace_id,user_id) on delete cascade,check(is_primary=(relevance='primary')));
create unique index story_one_primary on public.star_story_principles(story_id) where is_primary;
create index story_principle_lookup on public.star_story_principles(principle_id,story_id);
create index story_mapping_owner on public.star_story_principles(workspace_id,user_id);
create table public.behavioral_practice_bindings(session_id uuid primary key,item_id uuid not null unique,workspace_id uuid not null,user_id uuid not null,story_id uuid not null,story_version integer not null,prompt_id text references public.behavioral_prompts(id),story_snapshot jsonb not null check(jsonb_typeof(story_snapshot)='object' and octet_length(story_snapshot::text)<=200000),principle_ids text[] not null default '{}',cue_level integer not null default 0 check(cue_level between 0 and 2),committed boolean not null default false,retold boolean,confidence integer check(confidence between 1 and 5),clarity integer check(clarity between 1 and 5),action_specificity integer check(action_specificity between 1 and 5),result_specificity integer check(result_specificity between 1 and 5),reflection text not null default '' check(length(reflection)<=4000),request_hash text,foreign key(story_id,workspace_id,user_id) references public.star_stories(id,workspace_id,user_id),foreign key(item_id,session_id,workspace_id,user_id) references public.execution_session_items(id,session_id,workspace_id,user_id) on delete cascade,check(not committed or (retold is not null and confidence is not null and clarity is not null and action_specificity is not null and result_specificity is not null)));
create index behavioral_practice_owner on public.behavioral_practice_bindings(workspace_id,user_id,story_id,session_id);
create index behavioral_practice_story on public.behavioral_practice_bindings(story_id);
create index behavioral_practice_prompt on public.behavioral_practice_bindings(prompt_id);
create table public.behavioral_events(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,story_id uuid references public.star_stories(id),request_id uuid not null,event_type text not null check(event_type in ('story.created','story.updated','story.retired','story.restored','story.duplicated','story.mapped','framework.selected','framework.created','practice.started','practice.completed')),request_hash text not null,response jsonb not null default '{}',created_at timestamptz not null default now(),unique(workspace_id,user_id,request_id));
create index behavioral_event_story on public.behavioral_events(story_id,created_at desc);
alter table public.execution_sessions drop constraint execution_sessions_policy_version_check;
alter table public.execution_sessions add constraint execution_sessions_policy_version_check check(policy_version in ('execution-policy-v1','behavioral-policy-v1'));
do $$declare t text;begin
 foreach t in array array['behavioral_frameworks','behavioral_principles','behavioral_prompts','behavioral_prompt_principles','template_behavioral_frameworks','workspace_behavioral_settings','star_stories','star_story_principles','behavioral_practice_bindings','behavioral_events'] loop
 execute format('alter table public.%I enable row level security',t);execute format('alter table public.%I force row level security',t);execute format('revoke all on public.%I from public,anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);
 end loop;
 foreach t in array array['workspace_behavioral_settings','star_stories','star_story_principles','behavioral_practice_bindings','behavioral_events'] loop
 execute format('create policy behavioral_owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()) and public.is_workspace_member(workspace_id))',t);end loop;
end $$;
create policy behavioral_framework_read on public.behavioral_frameworks for select to authenticated using(status='published' and (workspace_id is null or (user_id=(select auth.uid()) and public.is_workspace_member(workspace_id))));
create policy behavioral_principle_read on public.behavioral_principles for select to authenticated using(exists(select 1 from public.behavioral_frameworks f where f.id=framework_id and f.version=framework_version));
create policy behavioral_prompt_read on public.behavioral_prompts for select to authenticated using(status='published' and exists(select 1 from public.behavioral_frameworks f where f.id=framework_id and f.version=framework_version));
create policy behavioral_prompt_mapping_read on public.behavioral_prompt_principles for select to authenticated using(exists(select 1 from public.behavioral_prompts p where p.id=prompt_id) and exists(select 1 from public.behavioral_principles p where p.id=principle_id));
create policy behavioral_template_read on public.template_behavioral_frameworks for select to authenticated using(true);

create function private.behavioral_context(p_slug text) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;fid text;fv integer;begin
 w:=private.revision_access(p_slug);
 select framework_id,framework_version into fid,fv from public.workspace_behavioral_settings where workspace_id=w.id and user_id=(select auth.uid());
 if fid is null then select b.framework_id,b.framework_version into fid,fv from public.workspace_targets t join public.template_behavioral_frameworks b on b.template_id=t.template_id and b.template_version=coalesce(t.template_version,1) where t.workspace_id=w.id;end if;
 fid:=coalesce(fid,'general-behavioral');fv:=coalesce(fv,1);
 return jsonb_build_object('workspace',jsonb_build_object('id',w.id,'slug',w.slug,'userId',(select auth.uid()),'timezone',w.timezone,'canEdit',w.status='active'),'framework',(select to_jsonb(f) from public.behavioral_frameworks f where f.id=fid and f.version=fv),
 'frameworks',(select jsonb_agg(jsonb_build_object('id',f.id,'version',f.version,'name',f.name,'source_type',f.source_type) order by f.name) from public.behavioral_frameworks f where f.status='published' and (f.workspace_id is null or (f.workspace_id=w.id and f.user_id=(select auth.uid())))),
 'principles',coalesce((select jsonb_agg(to_jsonb(p) order by p.sort_order,p.id) from public.behavioral_principles p where p.framework_id=fid and p.framework_version=fv),'[]'),'asOf',now());
end $$;

create function private.behavioral_story_rows(p_slug text,p_filters jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;rows jsonb;begin
 w:=private.revision_access(p_slug);if octet_length(p_filters::text)>2500 or length(coalesce(p_filters->>'search',''))>120 then raise exception 'Invalid story filters' using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by updated_at desc,id desc),'[]') into rows from(
 select s.id,s.title,s.summary,s.context,s.story_type,s.status,s.version,s.updated_at,
 coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'framework_id',p.framework_id,'framework_version',p.framework_version,'relevance',m.relevance) order by m.is_primary desc,p.sort_order) from public.star_story_principles m join public.behavioral_principles p on p.id=m.principle_id where m.story_id=s.id),'[]') as mappings,
 pr.last_practiced_at,pr.practice_count,pr.confidence,pr.cue_level,
 (select r.id from public.behavioral_practice_bindings b join public.revision_items r on r.entity_id=b.item_id where b.story_id=s.id and r.state in ('scheduled','snoozed') order by r.created_at limit 1) as revision_id,
 (select r.due_at from public.behavioral_practice_bindings b join public.revision_items r on r.entity_id=b.item_id where b.story_id=s.id and r.state in ('scheduled','snoozed') order by r.created_at limit 1) as due_at
 from public.star_stories s left join lateral(
 select max(q.completed_at) as last_practiced_at,count(*) as practice_count,(array_agg(b.confidence order by q.completed_at desc,q.id desc))[1] as confidence,(array_agg(b.cue_level order by q.completed_at desc,q.id desc))[1] as cue_level
 from public.behavioral_practice_bindings b join public.question_attempts q on q.item_id=b.item_id join public.execution_sessions e on e.id=b.session_id where b.story_id=s.id and b.committed and q.duration_ms>=15000 and q.reflection_status='completed' and e.status='completed') pr on true
 where s.workspace_id=w.id and s.user_id=(select auth.uid())
 and (coalesce(p_filters->>'status','active')='all' or (p_filters->>'status'='retired' and s.status='retired') or (coalesce(p_filters->>'status','active')='active' and s.status<>'retired') or s.status=p_filters->>'status')
 and (coalesce(p_filters->>'search','')='' or strpos(lower(s.title||' '||s.summary||' '||s.context),lower(p_filters->>'search'))>0 or exists(select 1 from public.star_story_principles m join public.behavioral_principles p on p.id=m.principle_id where m.story_id=s.id and strpos(lower(p.name),lower(p_filters->>'search'))>0))
 and (coalesce(p_filters->>'principle','')='' or exists(select 1 from public.star_story_principles m where m.story_id=s.id and m.principle_id=p_filters->>'principle'))
 and (coalesce(p_filters->>'type','')='' or s.story_type=p_filters->>'type') and (coalesce(p_filters->>'confidence','')='' or pr.confidence=(p_filters->>'confidence')::integer)
 and (coalesce(p_filters->>'practice','all')='all' or (p_filters->>'practice'='never' and pr.last_practiced_at is null) or (p_filters->>'practice'='stale' and pr.last_practiced_at<now()-interval '21 days') or (p_filters->>'practice'='recent' and pr.last_practiced_at>=now()-interval '21 days'))
 and (p_filters->>'beforeAt' is null or (s.updated_at,s.id)<((p_filters->>'beforeAt')::timestamptz,(p_filters->>'beforeId')::uuid)) order by s.updated_at desc,s.id desc limit 41) x;
 return rows;
end $$;

create function private.behavioral_history(p_slug text,p_story uuid default null,p_cursor jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;rows jsonb;begin
 w:=private.revision_access(p_slug);if octet_length(p_cursor::text)>1000 then raise exception 'Invalid history cursor' using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by completed_at desc,id desc),'[]') into rows from(
 select q.id,q.completed_at,q.duration_ms,q.session_id,b.story_id,s.title,b.prompt_id,b.cue_level,b.confidence,b.clarity,b.action_specificity,b.result_specificity,e.target_duration_seconds
 from public.behavioral_practice_bindings b join public.question_attempts q on q.item_id=b.item_id join public.star_stories s on s.id=b.story_id join public.execution_sessions e on e.id=b.session_id
 where b.workspace_id=w.id and b.user_id=(select auth.uid()) and b.committed and q.reflection_status='completed' and q.duration_ms>=15000 and e.status='completed' and (p_story is null or b.story_id=p_story)
 and (p_cursor->>'at' is null or (q.completed_at,q.id)<((p_cursor->>'at')::timestamptz,(p_cursor->>'id')::uuid)) order by q.completed_at desc,q.id desc limit 31) x;return rows;
end $$;

create function private.behavioral_coverage(p_slug text) returns jsonb language plpgsql security definer set search_path='' as $$
declare context jsonb;w public.workspaces%rowtype;rows jsonb;begin
 w:=private.revision_access(p_slug);context:=private.behavioral_context(p_slug);
 with evidence as materialized(
 select b.story_id,count(*) as practices,count(distinct (q.completed_at at time zone w.timezone)::date) as days,max(q.completed_at) as last_at,
 (array_agg(b.confidence order by q.completed_at desc,q.id desc))[1] as confidence,(array_agg(b.cue_level order by q.completed_at desc,q.id desc))[1] as cues,(array_agg(b.retold order by q.completed_at desc,q.id desc))[1] as retold
 from public.behavioral_practice_bindings b join public.question_attempts q on q.item_id=b.item_id join public.execution_sessions e on e.id=b.session_id where b.workspace_id=w.id and b.user_id=(select auth.uid()) and b.committed and q.reflection_status='completed' and q.duration_ms>=15000 and e.status='completed' group by b.story_id
 ),mapped as materialized(
 select m.principle_id,s.id,s.title,s.status,m.relevance,e.* from public.star_story_principles m join public.star_stories s on s.id=m.story_id left join evidence e on e.story_id=s.id where s.workspace_id=w.id and s.user_id=(select auth.uid()) and s.status<>'retired'
 ) select coalesce(jsonb_agg(to_jsonb(x) order by sort_order),'[]') into rows from(
 select p.id,p.framework_id,p.framework_version,p.name,p.description,p.guidance,p.common_mistake,p.priority,p.sort_order,
 (select count(*) from mapped m where m.principle_id=p.id) as story_count,
 coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'status',m.status,'last_at',m.last_at,'confidence',m.confidence,'cues',m.cues)) from(select * from mapped where principle_id=p.id order by (status='practice_ready') desc,last_at desc nulls last,id limit 5) m),'[]') as stories,
 case when exists(select 1 from mapped m where m.principle_id=p.id and m.status='practice_ready' and m.retold and m.practices>=2 and m.days>=2 and m.confidence>=4 and m.cues=0 and m.last_at>=now()-interval '14 days') then 'strong'
 when exists(select 1 from mapped m where m.principle_id=p.id and m.status='practice_ready' and m.retold and m.last_at>=now()-interval '21 days' and m.confidence>=3) then 'ready'
 when exists(select 1 from mapped m where m.principle_id=p.id and m.status='practice_ready') then 'needs_practice'
 when exists(select 1 from mapped m where m.principle_id=p.id) then 'draft' else 'no_story' end as state
 from public.behavioral_principles p where p.framework_id=context->'framework'->>'id' and p.framework_version=(context->'framework'->>'version')::integer limit 60) x;return rows;
end $$;

create function private.behavioral_prompts(p_slug text,p_search text default '',p_after text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;context jsonb;rows jsonb;begin
 w:=private.revision_access(p_slug);context:=private.behavioral_context(p_slug);if length(p_search)>120 or length(p_after)>200 then raise exception 'Invalid prompt filters' using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by id),'[]') into rows from(
 select p.*,coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name)) from public.behavioral_prompt_principles m join public.behavioral_principles b on b.id=m.principle_id where m.prompt_id=p.id),'[]') as principles,
 coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'status',s.status)) from(select distinct s.id,s.title,s.status from public.star_stories s join public.star_story_principles m on m.story_id=s.id join public.behavioral_prompt_principles pp on pp.principle_id=m.principle_id and pp.prompt_id=p.id where s.workspace_id=w.id and s.user_id=(select auth.uid()) and s.status<>'retired' order by s.status desc,s.id limit 3) s),'[]') as suggested_stories
 from public.behavioral_prompts p where p.framework_id=context->'framework'->>'id' and p.framework_version=(context->'framework'->>'version')::integer and p.status='published' and p.id>p_after and (p_search='' or strpos(lower(p.prompt||' '||p.category),lower(p_search))>0 or exists(select 1 from public.behavioral_prompt_principles m join public.behavioral_principles pr on pr.id=m.principle_id where m.prompt_id=p.id and strpos(lower(pr.name),lower(p_search))>0)) order by p.id limit 21) x;return rows;
end $$;

create function private.behavioral_detail(p_slug text,p_story uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;s public.star_stories%rowtype;begin
 w:=private.revision_access(p_slug);select * into s from public.star_stories where id=p_story and workspace_id=w.id and user_id=(select auth.uid());if s.id is null then raise exception 'Story unavailable' using errcode='42501';end if;
 return jsonb_build_object('story',to_jsonb(s),'mappings',coalesce((select jsonb_agg(to_jsonb(m)||jsonb_build_object('name',p.name,'framework_id',p.framework_id,'framework_version',p.framework_version)) from public.star_story_principles m join public.behavioral_principles p on p.id=m.principle_id where m.story_id=s.id),'[]'),'history',private.behavioral_history(p_slug,s.id),
 'revision',(select jsonb_build_object('id',r.id,'due_at',r.due_at,'state',r.state,'interval_days',r.interval_days) from public.behavioral_practice_bindings b join public.revision_items r on r.entity_id=b.item_id where b.story_id=s.id order by r.created_at limit 1));
end $$;

create function private.behavioral_command(p_slug text,p_request uuid,p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;s public.star_stories%rowtype;e public.behavioral_events%rowtype;copy public.star_stories%rowtype;command_kind text:=p_command->>'kind';patch jsonb;mapping jsonb;p public.behavioral_principles%rowtype;fid text;fv integer;response jsonb;r public.revision_items%rowtype;event_type text;begin
 w:=private.revision_access(p_slug,true);if p_request is null or p_command is null or octet_length(p_command::text)>200000 or command_kind is null then raise exception 'Invalid behavioral command' using errcode='22023';end if;
 select * into e from public.behavioral_events where workspace_id=w.id and user_id=(select auth.uid()) and request_id=p_request;
 if e.id is not null then if e.request_hash<>md5(p_command::text) then raise exception 'Behavioral request changed' using errcode='40001';end if;return e.response;end if;
 if command_kind='framework' then
  fid:=p_command->>'frameworkId';fv:=(p_command->>'frameworkVersion')::integer;
  if not exists(select 1 from public.behavioral_frameworks f where f.id=fid and f.version=fv and f.status='published' and (f.workspace_id is null or(f.workspace_id=w.id and f.user_id=(select auth.uid())))) then raise exception 'Framework unavailable' using errcode='42501';end if;
  insert into public.workspace_behavioral_settings(workspace_id,user_id,framework_id,framework_version) values(w.id,(select auth.uid()),fid,fv) on conflict(workspace_id,user_id) do update set framework_id=fid,framework_version=fv,version=workspace_behavioral_settings.version+1;response:=jsonb_build_object('selected',true);event_type:='framework.selected';
 elsif command_kind='custom_framework' then
  if length(btrim(p_command->>'name')) not between 1 and 120 or jsonb_typeof(p_command->'principles') is distinct from 'array' or jsonb_array_length(p_command->'principles') not between 1 and 30 or exists(select 1 from jsonb_array_elements_text(p_command->'principles') v where length(btrim(v)) not between 1 and 120) then raise exception 'Add a framework name and 1 to 30 competencies' using errcode='22023';end if;
  fid:=gen_random_uuid()::text;fv:=1;insert into public.behavioral_frameworks(id,version,name,description,source_type,workspace_id,user_id) values(fid,1,btrim(p_command->>'name'),'Private workspace competency framework','workspace_custom',w.id,(select auth.uid()));
  insert into public.behavioral_principles(id,framework_id,framework_version,name,description,guidance,common_mistake,sort_order) select gen_random_uuid()::text,fid,1,btrim(value),'Custom competency','Use a real experience and explain your own contribution.','Avoid unsupported claims.',ordinality::integer from jsonb_array_elements_text(p_command->'principles') with ordinality;
  response:=jsonb_build_object('frameworkId',fid,'version',1);event_type:='framework.created';
 else
  if command_kind='create' then
   insert into public.star_stories(workspace_id,user_id,title) values(w.id,(select auth.uid()),btrim(p_command->>'title')) returning * into s;event_type:='story.created';
  else
   select * into s from public.star_stories where id=(p_command->>'storyId')::uuid and workspace_id=w.id and user_id=(select auth.uid()) for update;if s.id is null then raise exception 'Story unavailable' using errcode='42501';end if;
   if s.version is distinct from (p_command->>'version')::integer then raise exception 'Story changed in another tab. Review before saving.' using errcode='40001';end if;
   if command_kind='edit' then
    patch:=p_command->'patch';if jsonb_typeof(patch) is distinct from 'object' or exists(select 1 from jsonb_object_keys(patch) k where k not in ('title','summary','situation','task','action','result','reflection','private_notes','context','period','story_type','status')) then raise exception 'Invalid story fields' using errcode='22023';end if;
    if s.status='retired' or patch->>'status'='retired' then raise exception 'Restore a retired story before editing' using errcode='22023';end if;
    update public.star_stories set title=coalesce(patch->>'title',title),summary=coalesce(patch->>'summary',summary),situation=coalesce(patch->>'situation',situation),task=coalesce(patch->>'task',task),action=coalesce(patch->>'action',public.star_stories.action),result=coalesce(patch->>'result',result),reflection=coalesce(patch->>'reflection',reflection),private_notes=coalesce(patch->>'private_notes',private_notes),context=coalesce(patch->>'context',context),period=coalesce(patch->>'period',period),story_type=case when patch?'story_type' then patch->>'story_type' else story_type end,status=coalesce(patch->>'status',status),version=version+1,updated_at=now() where id=s.id returning * into s;event_type:='story.updated';
   elsif command_kind='mapping' then
    if s.status='retired' or jsonb_typeof(p_command->'mappings') is distinct from 'array' or jsonb_array_length(p_command->'mappings')>20 then raise exception 'Choose up to 20 competencies' using errcode='22023';end if;
    if (select count(*) from jsonb_array_elements(p_command->'mappings') m where m->>'relevance'='primary')>1 then raise exception 'Choose one primary competency' using errcode='22023';end if;
    delete from public.star_story_principles where story_id=s.id;
    for mapping in select * from jsonb_array_elements(p_command->'mappings') loop
     select * into p from public.behavioral_principles where id=mapping->>'principleId';if p.id is null or not exists(select 1 from public.behavioral_frameworks f where f.id=p.framework_id and f.version=p.framework_version and f.status='published' and (f.workspace_id is null or(f.workspace_id=w.id and f.user_id=(select auth.uid())))) then raise exception 'Competency unavailable' using errcode='42501';end if;
     insert into public.star_story_principles(story_id,workspace_id,user_id,principle_id,relevance,is_primary,notes) values(s.id,w.id,(select auth.uid()),p.id,mapping->>'relevance',mapping->>'relevance'='primary',coalesce(mapping->>'notes',''));
    end loop;update public.star_stories set version=version+1,updated_at=now() where id=s.id returning * into s;event_type:='story.mapped';
   elsif command_kind='duplicate' then
    insert into public.star_stories(workspace_id,user_id,title,summary,situation,task,action,result,reflection,private_notes,context,period,story_type,status) values(w.id,(select auth.uid()),left(s.title||' · Copy',160),s.summary,s.situation,s.task,s.action,s.result,s.reflection,s.private_notes,s.context,s.period,s.story_type,'draft') returning * into copy;
    insert into public.star_story_principles select copy.id,workspace_id,user_id,principle_id,relevance,is_primary,notes from public.star_story_principles where story_id=s.id;s:=copy;event_type:='story.duplicated';
   elsif command_kind in ('retire','restore') then
    if exists(select 1 from public.behavioral_practice_bindings b join public.execution_sessions ex on ex.id=b.session_id left join public.question_attempts q on q.item_id=b.item_id where b.story_id=s.id and (ex.status in ('active','paused') or q.reflection_status='pending')) then raise exception 'Finish or abandon the active practice and reflection first' using errcode='40001';end if;
    select r0.* into r from public.revision_items r0 join public.behavioral_practice_bindings b on b.item_id=r0.entity_id where b.story_id=s.id order by r0.created_at limit 1;
    if r.id is not null and ((command_kind='retire' and r.state in ('scheduled','snoozed')) or (command_kind='restore' and r.state='retired')) then perform private.mutate_revision(p_slug,r.id,r.version,gen_random_uuid(),jsonb_build_object('kind',case when command_kind='retire' then 'retire' else 'restore' end));end if;
    update public.star_stories set status=case when command_kind='retire' then 'retired' else 'developing' end,retired_at=case when command_kind='retire' then now() else null end,version=version+1,updated_at=now() where id=s.id returning * into s;event_type:=case when command_kind='retire' then 'story.retired' else 'story.restored' end;
   else raise exception 'Unsupported behavioral command' using errcode='22023';end if;
  end if;response:=jsonb_build_object('storyId',s.id,'version',s.version);
 end if;
 insert into public.behavioral_events(workspace_id,user_id,story_id,request_id,event_type,request_hash,response) values(w.id,(select auth.uid()),s.id,p_request,event_type,md5(p_command::text),response);return response;
end $$;
create function private.behavioral_story_snapshot(p_story uuid) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('title',title,'situation',situation,'task',task,'action',action,'result',result,'reflection',reflection) from public.star_stories where id=p_story$$;
revoke all on function private.behavioral_story_snapshot(uuid) from public,anon,authenticated,service_role;
create function private.behavioral_session(p_slug text,p_session uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;b public.behavioral_practice_bindings%rowtype;begin
 w:=private.revision_access(p_slug);select * into b from public.behavioral_practice_bindings where session_id=p_session and workspace_id=w.id and user_id=(select auth.uid());if b.session_id is null then raise exception 'Behavioral practice unavailable' using errcode='42501';end if;
 return jsonb_build_object('execution',private.resolve_execution(p_slug,p_session),'binding',to_jsonb(b)-'story_snapshot'-'request_hash','title',b.story_snapshot->>'title',
 'cues',case when b.cue_level=2 then b.story_snapshot when b.cue_level=1 then (select jsonb_object_agg(key,left(value,180)) from jsonb_each_text(b.story_snapshot) where key<>'title') else null end);
end $$;
create function private.behavioral_launch(p_slug text,p_story uuid,p_prompt text,p_target integer,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;s public.star_stories%rowtype;p public.behavioral_prompts%rowtype;response jsonb;sid uuid;iid uuid;rid uuid;prior public.behavioral_events%rowtype;launch_hash text;begin
 w:=private.revision_access(p_slug,true);
 launch_hash:=md5(jsonb_build_object('story',p_story,'prompt',p_prompt,'target',p_target)::text);
 select * into prior from public.behavioral_events where workspace_id=w.id and user_id=(select auth.uid()) and request_id=p_request;
 if prior.id is not null then if prior.event_type<>'practice.started' or prior.request_hash<>launch_hash then raise exception 'Behavioral request changed' using errcode='40001';end if;return prior.response;end if;
 select * into s from public.star_stories where id=p_story and workspace_id=w.id and user_id=(select auth.uid()) for update;
 if s.id is null then raise exception 'Story unavailable' using errcode='42501';end if;if s.status='retired' then raise exception 'Restore the story before practicing' using errcode='22023';end if;
 if p_target is not null and p_target not between 60 and 900 then raise exception 'Choose a target from 1 to 15 minutes' using errcode='22023';end if;
 if p_prompt is not null then select * into p from public.behavioral_prompts where id=p_prompt and status='published';if p.id is null or not exists(select 1 from public.behavioral_frameworks f where f.id=p.framework_id and f.version=p.framework_version and (f.workspace_id is null or(f.workspace_id=w.id and f.user_id=(select auth.uid())))) then raise exception 'Prompt unavailable' using errcode='42501';end if;end if;
 response:=private.create_execution(p_slug,p_request,jsonb_build_object('mode','practice','source','manual','targetSeconds',p_target,'prompts',jsonb_build_array(jsonb_build_object('title',left(s.title,160),'body',coalesce(p.prompt,'Retell this real experience. Explain the situation, your responsibility, your individual actions, the result and what you learned.'),'topic','Behavioral self-practice','difficulty','unspecified','constraints','Self-practice. Cue usage and ratings are not automatic evaluation.','examples','[]'::jsonb,'hints','[]'::jsonb))));
 sid:=(response->'data'->'session'->>'id')::uuid;iid:=(response->'data'->'items'->0->>'id')::uuid;
 if not(response->>'ok')::boolean then return jsonb_build_object('sessionId',sid,'otherActive',true);end if;
 if exists(select 1 from public.behavioral_practice_bindings where session_id=sid) then return jsonb_build_object('sessionId',sid);end if;
 update public.execution_sessions set policy_version='behavioral-policy-v1',task_type='behavioral' where id=sid;
 insert into public.behavioral_practice_bindings(session_id,item_id,workspace_id,user_id,story_id,story_version,prompt_id,story_snapshot,principle_ids) values(sid,iid,w.id,(select auth.uid()),s.id,s.version,p.id,private.behavioral_story_snapshot(s.id),coalesce((select array_agg(principle_id) from public.star_story_principles where story_id=s.id),'{}'));
 select r.id into rid from public.behavioral_practice_bindings b join public.revision_items r on r.entity_id=b.item_id where b.story_id=s.id order by r.created_at limit 1;
 if rid is not null then insert into public.revision_execution_links(item_id,session_id,revision_item_id,workspace_id,user_id) values(iid,sid,rid,w.id,(select auth.uid()));end if;
 insert into public.behavioral_events(workspace_id,user_id,story_id,request_id,event_type,request_hash,response) values(w.id,(select auth.uid()),s.id,p_request,'practice.started',md5(jsonb_build_object('story',p_story,'prompt',p_prompt,'target',p_target)::text),jsonb_build_object('sessionId',sid));return jsonb_build_object('sessionId',sid);
end $$;
create function private.behavioral_cue(p_slug text,p_session uuid,p_level integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;b public.behavioral_practice_bindings%rowtype;begin
 w:=private.revision_access(p_slug,true);select * into b from public.behavioral_practice_bindings where session_id=p_session and workspace_id=w.id and user_id=(select auth.uid()) for update;
 if b.session_id is null then raise exception 'Practice unavailable' using errcode='42501';end if;
 if p_level is null or p_level not between 1 and 2 or b.committed or not exists(select 1 from public.execution_sessions where id=p_session and status in ('active','paused')) then raise exception 'Cues are unavailable in this state' using errcode='22023';end if;
 update public.behavioral_practice_bindings set cue_level=greatest(cue_level,p_level) where session_id=p_session;return private.behavioral_session(p_slug,p_session);
end $$;
create function private.behavioral_complete(p_slug text,p_session uuid,p_request uuid,p_evidence jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;b public.behavioral_practice_bindings%rowtype;e public.execution_sessions%rowtype;aid uuid;result text;response jsonb;begin
 w:=private.revision_access(p_slug,true);select * into b from public.behavioral_practice_bindings where session_id=p_session and workspace_id=w.id and user_id=(select auth.uid()) for update;if b.session_id is null then raise exception 'Practice unavailable' using errcode='42501';end if;
 if p_request is null or p_evidence is null or octet_length(p_evidence::text)>24000 or jsonb_typeof(p_evidence->'retold') is distinct from 'boolean' or length(coalesce(p_evidence->>'reflection',''))>4000 then raise exception 'Check the practice reflection' using errcode='22023';end if;
 if exists(select 1 from unnest(array['confidence','clarity','actionSpecificity','resultSpecificity']) field where (p_evidence->>field) is null or (p_evidence->>field)::integer not between 1 and 5) then raise exception 'Choose each self-rating from 1 to 5' using errcode='22023';end if;
 if b.committed then if b.request_hash<>md5(p_evidence::text) then raise exception 'This reflection is already committed' using errcode='40001';end if;return private.behavioral_session(p_slug,p_session);end if;
 select * into e from public.execution_sessions where id=p_session for update;if e.status<>'completed' then raise exception 'Finish the practice timer before reflecting' using errcode='22023';end if;
 result:=case when not(p_evidence->>'retold')::boolean then 'could_not_solve' when b.cue_level=2 then 'solved_major_hint' when b.cue_level=1 then 'solved_small_hint' else 'solved_independently' end;
 update public.behavioral_practice_bindings set committed=true,retold=(p_evidence->>'retold')::boolean,confidence=(p_evidence->>'confidence')::integer,clarity=(p_evidence->>'clarity')::integer,action_specificity=(p_evidence->>'actionSpecificity')::integer,result_specificity=(p_evidence->>'resultSpecificity')::integer,reflection=coalesce(p_evidence->>'reflection',''),request_hash=md5(p_evidence::text) where session_id=p_session;
 select id into aid from public.question_attempts where item_id=b.item_id;
 response:=private.mutate_execution(p_slug,p_session,e.version,p_request,jsonb_build_object('kind','debrief','attemptId',aid,'result',result,'confidence',(p_evidence->>'confidence')::integer,'approach','','patternId',null,'timeComplexity','','spaceComplexity','','mistakes','[]'::jsonb,'notes','Behavioral self-practice; self-ratings, not automated observation.'));
 insert into public.behavioral_events(workspace_id,user_id,story_id,request_id,event_type,request_hash,response) values(w.id,(select auth.uid()),b.story_id,p_request,'practice.completed',md5(p_evidence::text),jsonb_build_object('sessionId',p_session));return private.behavioral_session(p_slug,p_session);
end $$;
create function private.behavioral_evidence_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare b public.behavioral_practice_bindings%rowtype;expected text;begin
 if new.reflection_status='completed' then select * into b from public.behavioral_practice_bindings where item_id=new.item_id;if b.item_id is not null then expected:=case when not b.retold then 'could_not_solve' when b.cue_level=2 then 'solved_major_hint' when b.cue_level=1 then 'solved_small_hint' else 'solved_independently' end;if not b.committed or new.result is distinct from expected or new.confidence is distinct from b.confidence then raise exception 'Use the behavioral self-practice reflection' using errcode='22023';end if;end if;end if;return new;
end $$;
revoke all on function private.behavioral_evidence_guard() from public,anon,authenticated,service_role;
create trigger behavioral_evidence_validation before insert or update on public.question_attempts for each row execute function private.behavioral_evidence_guard();
-- Revision launch routes back to this domain while keeping the shared schedule and history.
create function private.behavioral_revision_binding() returns trigger language plpgsql security definer set search_path='' as $$
declare origin public.behavioral_practice_bindings%rowtype;s public.star_stories%rowtype;begin
 if exists(select 1 from public.behavioral_practice_bindings where item_id=new.item_id) then return new;end if;
 select b.* into origin from public.revision_items r join public.behavioral_practice_bindings b on b.item_id=r.entity_id where r.id=new.revision_item_id;
 if origin.item_id is null then return new;end if;
 select * into s from public.star_stories where id=origin.story_id and workspace_id=new.workspace_id and user_id=new.user_id;
 if s.id is null or s.status='retired' then raise exception 'Restore the story before reviewing it' using errcode='22023';end if;
 insert into public.behavioral_practice_bindings(session_id,item_id,workspace_id,user_id,story_id,story_version,prompt_id,story_snapshot,principle_ids) values(new.session_id,new.item_id,new.workspace_id,new.user_id,s.id,s.version,origin.prompt_id,private.behavioral_story_snapshot(s.id),coalesce((select array_agg(principle_id) from public.star_story_principles where story_id=s.id),'{}'));
 update public.execution_sessions set policy_version='behavioral-policy-v1',task_type='behavioral',target_duration_seconds=120 where id=new.session_id;return new;
end $$;
revoke all on function private.behavioral_revision_binding() from public,anon,authenticated,service_role;
create trigger behavioral_revision_route after insert on public.revision_execution_links for each row execute function private.behavioral_revision_binding();

create function private.behavioral_home(p_slug text,p_filters jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare context jsonb;coverage jsonb;prompts jsonb;begin
 context:=private.behavioral_context(p_slug);
 begin coverage:=private.behavioral_coverage(p_slug);exception when others then coverage:=null;end;
 begin prompts:=private.behavioral_prompts(p_slug);exception when others then prompts:=null;end;
 return jsonb_build_object('context',context,'stories',private.behavioral_story_rows(p_slug,p_filters),'coverage',coverage,'prompts',prompts,'history',private.behavioral_history(p_slug));
end $$;
create function public.behavioral_home(p_slug text,p_filters jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select private.behavioral_home(p_slug,p_filters)$$;
create function public.behavioral_story_rows(p_slug text,p_filters jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select private.behavioral_story_rows(p_slug,p_filters)$$;
create function public.behavioral_detail(p_slug text,p_story uuid) returns jsonb language sql security invoker set search_path='' as $$select private.behavioral_detail(p_slug,p_story)$$;
create function public.behavioral_history(p_slug text,p_story uuid default null,p_cursor jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select private.behavioral_history(p_slug,p_story,p_cursor)$$;
create function public.behavioral_prompts(p_slug text,p_search text default '',p_after text default '') returns jsonb language sql security invoker set search_path='' as $$select private.behavioral_prompts(p_slug,p_search,p_after)$$;
create function public.behavioral_command(p_slug text,p_request uuid,p_command jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.behavioral_command(p_slug,p_request,p_command)$$;
create function public.behavioral_launch(p_slug text,p_story uuid,p_prompt text,p_target integer,p_request uuid) returns jsonb language sql security invoker set search_path='' as $$select private.behavioral_launch(p_slug,p_story,p_prompt,p_target,p_request)$$;
create function public.behavioral_session(p_slug text,p_session uuid) returns jsonb language sql security invoker set search_path='' as $$select private.behavioral_session(p_slug,p_session)$$;
create function public.behavioral_cue(p_slug text,p_session uuid,p_level integer) returns jsonb language sql security invoker set search_path='' as $$select private.behavioral_cue(p_slug,p_session,p_level)$$;
create function public.behavioral_complete(p_slug text,p_session uuid,p_request uuid,p_evidence jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.behavioral_complete(p_slug,p_session,p_request,p_evidence)$$;
do $$declare sig text;begin
 foreach sig in array array['behavioral_context(text)','behavioral_coverage(text)'] loop execute 'revoke all on function private.'||sig||' from public,anon,authenticated,service_role';end loop;
 foreach sig in array array['behavioral_home(text,jsonb)','behavioral_story_rows(text,jsonb)','behavioral_detail(text,uuid)','behavioral_history(text,uuid,jsonb)','behavioral_prompts(text,text,text)','behavioral_command(text,uuid,jsonb)','behavioral_launch(text,uuid,text,integer,uuid)','behavioral_session(text,uuid)','behavioral_cue(text,uuid,integer)','behavioral_complete(text,uuid,uuid,jsonb)'] loop execute 'revoke all on function private.'||sig||' from public,anon,service_role';execute 'grant execute on function private.'||sig||' to authenticated';execute 'revoke all on function public.'||sig||' from public,anon,service_role';execute 'grant execute on function public.'||sig||' to authenticated';end loop;
end $$;

-- Canonical framework release 1; no user stories are seeded.
insert into public.behavioral_frameworks(id,version,name,description,source_type,source_reference) values
('general-behavioral',1,'General Software Engineering','Company-neutral behavioral competencies for software engineering interviews.','platform',null),
('amazon-leadership',1,'Amazon Leadership Principles','Official principle names with original PrepCraft preparation guidance. Version checked 2026-10-25.','company_template','https://www.amazon.jobs/content/en/our-workplace/leadership-principles');
insert into public.behavioral_principles(id,framework_id,framework_version,name,description,guidance,common_mistake,sort_order,priority) values
('general-behavioral-v1-ownership','general-behavioral',1,'Ownership','Prepare a truthful experience that demonstrates ownership.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',0,'high'),
('general-behavioral-v1-collaboration','general-behavioral',1,'Collaboration','Prepare a truthful experience that demonstrates collaboration.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',1,'high'),
('general-behavioral-v1-conflict-resolution','general-behavioral',1,'Conflict Resolution','Prepare a truthful experience that demonstrates conflict resolution.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',2,'high'),
('general-behavioral-v1-communication','general-behavioral',1,'Communication','Prepare a truthful experience that demonstrates communication.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',3,'high'),
('general-behavioral-v1-leadership','general-behavioral',1,'Leadership','Prepare a truthful experience that demonstrates leadership.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',4,'medium'),
('general-behavioral-v1-initiative','general-behavioral',1,'Initiative','Prepare a truthful experience that demonstrates initiative.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',5,'medium'),
('general-behavioral-v1-problem-solving','general-behavioral',1,'Problem Solving','Prepare a truthful experience that demonstrates problem solving.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',6,'medium'),
('general-behavioral-v1-adaptability','general-behavioral',1,'Adaptability','Prepare a truthful experience that demonstrates adaptability.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',7,'medium'),
('general-behavioral-v1-learning','general-behavioral',1,'Learning','Prepare a truthful experience that demonstrates learning.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',8,'medium'),
('general-behavioral-v1-failure-recovery','general-behavioral',1,'Failure & Recovery','Prepare a truthful experience that demonstrates failure & recovery.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',9,'medium'),
('general-behavioral-v1-decision-making','general-behavioral',1,'Decision Making','Prepare a truthful experience that demonstrates decision making.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',10,'medium'),
('general-behavioral-v1-ambiguity','general-behavioral',1,'Ambiguity','Prepare a truthful experience that demonstrates ambiguity.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',11,'medium'),
('general-behavioral-v1-customer-user-focus','general-behavioral',1,'Customer / User Focus','Prepare a truthful experience that demonstrates customer / user focus.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',12,'medium'),
('general-behavioral-v1-quality','general-behavioral',1,'Quality','Prepare a truthful experience that demonstrates quality.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',13,'medium'),
('general-behavioral-v1-prioritization','general-behavioral',1,'Prioritization','Prepare a truthful experience that demonstrates prioritization.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',14,'medium'),
('general-behavioral-v1-time-management','general-behavioral',1,'Time Management','Prepare a truthful experience that demonstrates time management.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',15,'medium'),
('general-behavioral-v1-technical-judgment','general-behavioral',1,'Technical Judgment','Prepare a truthful experience that demonstrates technical judgment.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',16,'medium'),
('general-behavioral-v1-mentoring','general-behavioral',1,'Mentoring','Prepare a truthful experience that demonstrates mentoring.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',17,'medium'),
('general-behavioral-v1-influence','general-behavioral',1,'Influence','Prepare a truthful experience that demonstrates influence.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',18,'medium'),
('general-behavioral-v1-delivery-under-pressure','general-behavioral',1,'Delivery Under Pressure','Prepare a truthful experience that demonstrates delivery under pressure.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',19,'medium'),
('amazon-leadership-v1-customer-obsession','amazon-leadership',1,'Customer Obsession','Prepare a truthful experience that demonstrates customer obsession.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',0,'high'),
('amazon-leadership-v1-ownership','amazon-leadership',1,'Ownership','Prepare a truthful experience that demonstrates ownership.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',1,'high'),
('amazon-leadership-v1-invent-and-simplify','amazon-leadership',1,'Invent and Simplify','Prepare a truthful experience that demonstrates invent and simplify.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',2,'high'),
('amazon-leadership-v1-are-right-a-lot','amazon-leadership',1,'Are Right, A Lot','Prepare a truthful experience that demonstrates are right, a lot.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',3,'high'),
('amazon-leadership-v1-learn-and-be-curious','amazon-leadership',1,'Learn and Be Curious','Prepare a truthful experience that demonstrates learn and be curious.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',4,'medium'),
('amazon-leadership-v1-hire-and-develop-the-best','amazon-leadership',1,'Hire and Develop the Best','Prepare a truthful experience that demonstrates hire and develop the best.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',5,'medium'),
('amazon-leadership-v1-insist-on-the-highest-standards','amazon-leadership',1,'Insist on the Highest Standards','Prepare a truthful experience that demonstrates insist on the highest standards.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',6,'medium'),
('amazon-leadership-v1-think-big','amazon-leadership',1,'Think Big','Prepare a truthful experience that demonstrates think big.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',7,'medium'),
('amazon-leadership-v1-bias-for-action','amazon-leadership',1,'Bias for Action','Prepare a truthful experience that demonstrates bias for action.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',8,'medium'),
('amazon-leadership-v1-frugality','amazon-leadership',1,'Frugality','Prepare a truthful experience that demonstrates frugality.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',9,'medium'),
('amazon-leadership-v1-earn-trust','amazon-leadership',1,'Earn Trust','Prepare a truthful experience that demonstrates earn trust.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',10,'medium'),
('amazon-leadership-v1-dive-deep','amazon-leadership',1,'Dive Deep','Prepare a truthful experience that demonstrates dive deep.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',11,'medium'),
('amazon-leadership-v1-have-backbone-disagree-and-commit','amazon-leadership',1,'Have Backbone; Disagree and Commit','Prepare a truthful experience that demonstrates have backbone; disagree and commit.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',12,'medium'),
('amazon-leadership-v1-deliver-results','amazon-leadership',1,'Deliver Results','Prepare a truthful experience that demonstrates deliver results.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',13,'medium'),
('amazon-leadership-v1-strive-to-be-earth-s-best-employer','amazon-leadership',1,'Strive to be Earth’s Best Employer','Prepare a truthful experience that demonstrates strive to be earth’s best employer.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',14,'medium'),
('amazon-leadership-v1-success-and-scale-bring-broad-responsibility','amazon-leadership',1,'Success and Scale Bring Broad Responsibility','Prepare a truthful experience that demonstrates success and scale bring broad responsibility.','Explain your responsibility, decisions, personal actions, result and reflection. Keep the facts consistent across different framings.','Giving a vague team summary without explaining your own contribution or observable outcome.',15,'medium');
insert into public.behavioral_prompts(id,framework_id,framework_version,prompt,category,follow_ups) values
('general-behavioral-v1-ownership-prompt','general-behavioral',1,'Tell me about a time you took responsibility beyond your normal scope.','Ownership','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-collaboration-prompt','general-behavioral',1,'Describe a project that depended on collaboration across different roles.','Collaboration','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-conflict-resolution-prompt','general-behavioral',1,'Tell me about a disagreement you helped resolve.','Conflict Resolution','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-communication-prompt','general-behavioral',1,'Describe a time you explained a difficult idea to a different audience.','Communication','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-leadership-prompt','general-behavioral',1,'Tell me about a time you helped a group make progress without relying on your title.','Leadership','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-initiative-prompt','general-behavioral',1,'Describe an improvement you initiated before being asked.','Initiative','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-problem-solving-prompt','general-behavioral',1,'Tell me about a difficult problem and how you narrowed down its cause.','Problem Solving','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-adaptability-prompt','general-behavioral',1,'Describe a time you adapted when the original plan stopped working.','Adaptability','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-learning-prompt','general-behavioral',1,'Tell me about something unfamiliar you learned to solve a real problem.','Learning','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-failure-recovery-prompt','general-behavioral',1,'Describe a decision or project that did not go as planned and what you changed afterward.','Failure & Recovery','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-decision-making-prompt','general-behavioral',1,'Tell me about a decision where you considered several reasonable alternatives.','Decision Making','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-ambiguity-prompt','general-behavioral',1,'Describe a time you made progress with incomplete information.','Ambiguity','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-customer-user-focus-prompt','general-behavioral',1,'Tell me about a choice you made to improve a user’s experience.','Customer / User Focus','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-quality-prompt','general-behavioral',1,'Describe a time you prevented or corrected a quality problem.','Quality','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-prioritization-prompt','general-behavioral',1,'Tell me about a time you had to choose what not to do.','Prioritization','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-time-management-prompt','general-behavioral',1,'Describe a time you managed competing commitments.','Time Management','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-technical-judgment-prompt','general-behavioral',1,'Tell me about a technical trade-off and the evidence behind your choice.','Technical Judgment','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-mentoring-prompt','general-behavioral',1,'Describe a time you helped another person grow.','Mentoring','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-influence-prompt','general-behavioral',1,'Tell me about a time you persuaded others without formal authority.','Influence','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('general-behavioral-v1-delivery-under-pressure-prompt','general-behavioral',1,'Describe a time you delivered useful work under significant time pressure.','Delivery Under Pressure','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-customer-obsession-prompt','amazon-leadership',1,'Describe a real experience involving a decision shaped by a user need.','Customer Obsession','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-ownership-prompt','amazon-leadership',1,'Describe a real experience involving taking responsibility beyond an assigned task.','Ownership','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-invent-and-simplify-prompt','amazon-leadership',1,'Describe a real experience involving simplifying a difficult workflow.','Invent and Simplify','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-are-right-a-lot-prompt','amazon-leadership',1,'Describe a real experience involving changing your mind after new evidence.','Are Right, A Lot','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-learn-and-be-curious-prompt','amazon-leadership',1,'Describe a real experience involving learning an unfamiliar subject.','Learn and Be Curious','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-hire-and-develop-the-best-prompt','amazon-leadership',1,'Describe a real experience involving helping someone else improve.','Hire and Develop the Best','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-insist-on-the-highest-standards-prompt','amazon-leadership',1,'Describe a real experience involving improving a process that produced defects.','Insist on the Highest Standards','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-think-big-prompt','amazon-leadership',1,'Describe a real experience involving proposing a larger useful direction.','Think Big','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-bias-for-action-prompt','amazon-leadership',1,'Describe a real experience involving moving forward with a reversible decision.','Bias for Action','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-frugality-prompt','amazon-leadership',1,'Describe a real experience involving working within a real resource constraint.','Frugality','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-earn-trust-prompt','amazon-leadership',1,'Describe a real experience involving rebuilding trust after a disagreement.','Earn Trust','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-dive-deep-prompt','amazon-leadership',1,'Describe a real experience involving finding the cause of a difficult technical issue.','Dive Deep','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-have-backbone-disagree-and-commit-prompt','amazon-leadership',1,'Describe a real experience involving challenging a decision and then supporting its outcome.','Have Backbone; Disagree and Commit','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-deliver-results-prompt','amazon-leadership',1,'Describe a real experience involving delivering a useful result despite a setback.','Deliver Results','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-strive-to-be-earth-s-best-employer-prompt','amazon-leadership',1,'Describe a real experience involving making a team environment more supportive.','Strive to be Earth’s Best Employer','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]'),
('amazon-leadership-v1-success-and-scale-bring-broad-responsibility-prompt','amazon-leadership',1,'Describe a real experience involving considering the wider effects of a technical decision.','Success and Scale Bring Broad Responsibility','["What was your individual contribution?","Why did you choose that approach?","What alternatives did you consider?","How did you observe the result?","What would you change next time?"]');
insert into public.behavioral_prompt_principles(prompt_id,principle_id) values
('general-behavioral-v1-ownership-prompt','general-behavioral-v1-ownership'),
('general-behavioral-v1-collaboration-prompt','general-behavioral-v1-collaboration'),
('general-behavioral-v1-conflict-resolution-prompt','general-behavioral-v1-conflict-resolution'),
('general-behavioral-v1-communication-prompt','general-behavioral-v1-communication'),
('general-behavioral-v1-leadership-prompt','general-behavioral-v1-leadership'),
('general-behavioral-v1-initiative-prompt','general-behavioral-v1-initiative'),
('general-behavioral-v1-problem-solving-prompt','general-behavioral-v1-problem-solving'),
('general-behavioral-v1-adaptability-prompt','general-behavioral-v1-adaptability'),
('general-behavioral-v1-learning-prompt','general-behavioral-v1-learning'),
('general-behavioral-v1-failure-recovery-prompt','general-behavioral-v1-failure-recovery'),
('general-behavioral-v1-decision-making-prompt','general-behavioral-v1-decision-making'),
('general-behavioral-v1-ambiguity-prompt','general-behavioral-v1-ambiguity'),
('general-behavioral-v1-customer-user-focus-prompt','general-behavioral-v1-customer-user-focus'),
('general-behavioral-v1-quality-prompt','general-behavioral-v1-quality'),
('general-behavioral-v1-prioritization-prompt','general-behavioral-v1-prioritization'),
('general-behavioral-v1-time-management-prompt','general-behavioral-v1-time-management'),
('general-behavioral-v1-technical-judgment-prompt','general-behavioral-v1-technical-judgment'),
('general-behavioral-v1-mentoring-prompt','general-behavioral-v1-mentoring'),
('general-behavioral-v1-influence-prompt','general-behavioral-v1-influence'),
('general-behavioral-v1-delivery-under-pressure-prompt','general-behavioral-v1-delivery-under-pressure'),
('amazon-leadership-v1-customer-obsession-prompt','amazon-leadership-v1-customer-obsession'),
('amazon-leadership-v1-ownership-prompt','amazon-leadership-v1-ownership'),
('amazon-leadership-v1-invent-and-simplify-prompt','amazon-leadership-v1-invent-and-simplify'),
('amazon-leadership-v1-are-right-a-lot-prompt','amazon-leadership-v1-are-right-a-lot'),
('amazon-leadership-v1-learn-and-be-curious-prompt','amazon-leadership-v1-learn-and-be-curious'),
('amazon-leadership-v1-hire-and-develop-the-best-prompt','amazon-leadership-v1-hire-and-develop-the-best'),
('amazon-leadership-v1-insist-on-the-highest-standards-prompt','amazon-leadership-v1-insist-on-the-highest-standards'),
('amazon-leadership-v1-think-big-prompt','amazon-leadership-v1-think-big'),
('amazon-leadership-v1-bias-for-action-prompt','amazon-leadership-v1-bias-for-action'),
('amazon-leadership-v1-frugality-prompt','amazon-leadership-v1-frugality'),
('amazon-leadership-v1-earn-trust-prompt','amazon-leadership-v1-earn-trust'),
('amazon-leadership-v1-dive-deep-prompt','amazon-leadership-v1-dive-deep'),
('amazon-leadership-v1-have-backbone-disagree-and-commit-prompt','amazon-leadership-v1-have-backbone-disagree-and-commit'),
('amazon-leadership-v1-deliver-results-prompt','amazon-leadership-v1-deliver-results'),
('amazon-leadership-v1-strive-to-be-earth-s-best-employer-prompt','amazon-leadership-v1-strive-to-be-earth-s-best-employer'),
('amazon-leadership-v1-success-and-scale-bring-broad-responsibility-prompt','amazon-leadership-v1-success-and-scale-bring-broad-responsibility');
insert into public.template_behavioral_frameworks(template_id,template_version,framework_id,framework_version) select template_id,version_number,case when template_id='amazon-sde' then 'amazon-leadership' else 'general-behavioral' end,1 from public.preparation_template_versions;

-- Published framework versions are append-only. Corrections require a new version.
create function private.behavioral_publication_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare published boolean;begin
 if tg_table_name='behavioral_frameworks' then published:=old.status='published' and old.workspace_id is null;
 else select f.status='published' and f.workspace_id is null into published from public.behavioral_frameworks f where f.id=old.framework_id and f.version=old.framework_version;end if;
 if published then raise exception 'Published behavioral versions are immutable; publish a new version' using errcode='55000';end if;
 if tg_op='DELETE' then return old;end if;return new;
end $$;
revoke all on function private.behavioral_publication_guard() from public,anon,authenticated,service_role;
create trigger behavioral_framework_immutable before update or delete on public.behavioral_frameworks for each row execute function private.behavioral_publication_guard();
create trigger behavioral_principle_immutable before update or delete on public.behavioral_principles for each row execute function private.behavioral_publication_guard();
create trigger behavioral_prompt_immutable before update or delete on public.behavioral_prompts for each row execute function private.behavioral_publication_guard();

create or replace function private.consume_revision_attempt(p_attempt uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.question_attempts%rowtype;r public.revision_items%rowtype;origin public.execution_session_items%rowtype;linked uuid;outcome text;days integer;next_due timestamptz;zone text;reason text;hint integer;
begin
 select * into a from public.question_attempts where id=p_attempt for update;
 if a.id is null or a.reflection_status<>'completed' then return null;end if;
 if a.duration_ms<15000 and exists(select 1 from public.behavioral_practice_bindings bp where bp.item_id=a.item_id) then return null;end if;
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
 if linked is not null and r.due_at>a.completed_at and (exists(select 1 from public.learning_execution_bindings b where b.item_id=a.item_id and b.submitted_at is not null) or exists(select 1 from public.behavioral_practice_bindings b where b.item_id=a.item_id and b.committed)) then
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
 where q.workspace_id=w.id and q.user_id=(select auth.uid()) and q.reflection_status='completed' and not exists(select 1 from public.behavioral_practice_bindings bp where bp.item_id=q.item_id) and not exists(select 1 from public.revision_attempts early where early.source_attempt_id=q.id and early.schedule_reason='EARLY_PRACTICE_NO_ADVANCE') and q.completed_at>=p_at-make_interval(days=>p_days) and q.completed_at<=p_at and (q.duration_ms>=30000 or exists(select 1 from public.learning_execution_bindings lb where lb.item_id=q.item_id and lb.submitted_at is not null)) and s.status in ('completed','expired')
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
 where q.workspace_id=w.id and q.user_id=(select auth.uid()) and q.reflection_status='completed' and not exists(select 1 from public.behavioral_practice_bindings bp where bp.item_id=q.item_id) and not exists(select 1 from public.revision_attempts early where early.source_attempt_id=q.id and early.schedule_reason='EARLY_PRACTICE_NO_ADVANCE') and (q.duration_ms>=30000 or exists(select 1 from public.learning_execution_bindings lb where lb.item_id=q.item_id and lb.submitted_at is not null)) and ((p_type='topic' and a.topic_id=p_entity) or (p_type='pattern' and q.pattern_id=p_entity))
 and (p_before is null or (q.completed_at,q.id)<((p_before->>'at')::timestamptz,(p_before->>'id')::uuid)) order by q.completed_at desc,q.id desc limit 31
 ) v;return evidence_json;
end $$;
