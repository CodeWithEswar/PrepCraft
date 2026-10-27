-- PostgreSQL owns file lifecycle, authorization grants, audits and durable background state.
create table public.files(
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete restrict,owner_user_id uuid not null references auth.users(id) on delete restrict,
 environment text not null check(environment in ('production','preview')),bucket text not null check(bucket in ('prepcraft-private-files','prepcraft-preview-files')),object_key text not null unique,
 original_filename text not null check(length(original_filename) between 1 and 160 and original_filename !~ '[[:cntrl:]/]' and position(chr(92) in original_filename)=0),display_name text not null check(length(btrim(display_name)) between 1 and 160),
 category text not null check(category in ('resume','attachment','export','report')),mime_type text not null check(mime_type in ('application/pdf','image/png','image/jpeg','text/plain','application/json')),
 size_bytes bigint not null check(size_bytes between 1 and 10485760),checksum text not null check(checksum~'^[a-f0-9]{64}$'),etag text,status text not null default 'PENDING_UPLOAD' check(status in ('PENDING_UPLOAD','READY','FAILED','DELETING','DELETED')),
 version integer not null default 0,failure_code text,last_checked_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),deleted_at timestamptz,
 unique(id,workspace_id,owner_user_id),check((status='DELETED')=(deleted_at is not null)),check(category<>'resume' or mime_type='application/pdf'),check((environment='production')=(bucket='prepcraft-private-files'))
);
create index files_owner_cursor on public.files(owner_user_id,workspace_id,created_at desc,id desc) where status<>'DELETED';
create index files_reconcile on public.files(last_checked_at,id) where status in ('PENDING_UPLOAD','READY','DELETING');
create table public.platform_audit(
 id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id) on delete set null,workspace_id uuid references public.workspaces(id) on delete set null,target_id uuid,action text not null check(action in ('file.upload_requested','file.ready','file.upload_failed','file.download_authorized','file.delete_requested','file.deleted','file.missing','file.upload_expired','export.requested','account.delete_requested','job.failed')),
 request_id uuid not null,metadata jsonb not null default '{}' check(jsonb_typeof(metadata)='object' and octet_length(metadata::text)<=1000),created_at timestamptz not null default now()
);
create index platform_audit_owner on public.platform_audit(actor_id,workspace_id,created_at desc);
create table private.file_operations(
 id uuid primary key default gen_random_uuid(),file_id uuid not null references public.files(id) on delete cascade,workspace_id uuid not null,user_id uuid not null,
 kind text not null check(kind in ('upload','download')),token_hash text not null unique,expires_at timestamptz not null,consumed_at timestamptz,attempts integer not null default 0 check(attempts between 0 and 3),lease_token uuid,lease_until timestamptz,request_id uuid not null,created_at timestamptz not null default now(),
 foreign key(file_id,workspace_id,user_id) references public.files(id,workspace_id,owner_user_id) on delete cascade
);
create index file_operations_expiry on private.file_operations(expires_at) where consumed_at is null;
create table private.platform_jobs(
 id uuid primary key default gen_random_uuid(),event_id uuid not null unique default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('file.delete','attempt.observe')),source_id uuid not null,environment text not null default 'production' check(environment in ('production','preview')),correlation_id uuid not null,causation_id uuid,
 status text not null default 'pending' check(status in ('pending','publishing','queued','processing','done','failed','suppressed')),attempt_count integer not null default 0,publish_attempts integer not null default 0,available_at timestamptz not null default now(),lease_token uuid,lease_until timestamptz,failure_code text,created_at timestamptz not null default now(),completed_at timestamptz,
 unique(kind,source_id)
);
create index platform_jobs_due on private.platform_jobs(available_at,id) where status in ('pending','publishing','processing');
create index platform_jobs_scope on private.platform_jobs(user_id,workspace_id);
create table private.processed_events(consumer_name text not null,event_id uuid not null,result_status text not null check(result_status in ('processed','suppressed')),processed_at timestamptz not null default now(),primary key(consumer_name,event_id));
create table private.platform_runtime(environment text primary key check(environment in ('production','preview')),files_enabled boolean not null default false,last_dispatch_at timestamptz,last_success_at timestamptz,list_cursor text,orphan_scan_at timestamptz);
insert into private.platform_runtime(environment) values('production'),('preview');
create table private.file_orphan_observations(object_key text primary key,environment text not null,first_seen_at timestamptz not null default now(),last_seen_at timestamptz not null default now(),size_bytes bigint not null);
alter table public.files enable row level security;alter table public.files force row level security;
revoke all on public.files from public,anon,authenticated,service_role;grant select on public.files to authenticated;
create policy file_owner_read on public.files for select to authenticated using(owner_user_id=(select auth.uid()) and public.is_workspace_member(workspace_id));
alter table public.platform_audit enable row level security;alter table public.platform_audit force row level security;
revoke all on public.platform_audit from public,anon,authenticated,service_role;grant select on public.platform_audit to authenticated;
create policy audit_actor_read on public.platform_audit for select to authenticated using(actor_id=(select auth.uid()) and (workspace_id is null or public.is_workspace_member(workspace_id)));
do $$declare t text;begin foreach t in array array['file_operations','platform_jobs','processed_events','platform_runtime','file_orphan_observations'] loop execute 'alter table private.'||t||' enable row level security';execute 'alter table private.'||t||' force row level security';execute 'revoke all on private.'||t||' from public,anon,authenticated,service_role';end loop;end $$;

create function private.platform_access(p_slug text,p_write boolean default false) returns public.workspaces language plpgsql security definer set search_path='' as $$begin return private.revision_access(p_slug,p_write);end $$;
create function private.platform_service() returns void language plpgsql security definer set search_path='' as $$begin if current_setting('role',true)<>'service_role' then raise exception 'Platform service access required' using errcode='42501';end if;end $$;
create function private.platform_file_json(f public.files) returns jsonb language sql immutable set search_path='' as $$select jsonb_build_object('id',f.id,'workspaceId',f.workspace_id,'name',f.display_name,'originalName',f.original_filename,'category',f.category,'mime',f.mime_type,'bytes',f.size_bytes,'checksum',f.checksum,'status',f.status,'version',f.version,'failureCode',f.failure_code,'createdAt',f.created_at,'updatedAt',f.updated_at)$$;
create function private.platform_file_list(p_slug text,p_cursor jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;rows jsonb;cursor jsonb;begin w:=private.platform_access(p_slug);
 with selected as materialized(select f.* from public.files f where f.workspace_id=w.id and f.owner_user_id=(select auth.uid()) and f.status<>'DELETED' and (p_cursor->>'at' is null or (f.created_at,f.id)<((p_cursor->>'at')::timestamptz,(p_cursor->>'id')::uuid)) order by f.created_at desc,f.id desc limit 31)
 select coalesce((select jsonb_agg(private.platform_file_json(x) order by x.created_at desc,x.id desc) from(select * from selected order by created_at desc,id desc limit 30)x),'[]'::jsonb),case when(select count(*) from selected)>30 then(select jsonb_build_object('at',created_at,'id',id) from selected order by created_at desc,id desc offset 29 limit 1) end into rows,cursor;
 return jsonb_build_object('workspace',jsonb_build_object('id',w.id,'slug',w.slug,'name',w.name,'userId',(select auth.uid()),'canEdit',w.status='active'),'items',rows,'cursor',cursor);
end $$;

-- Adapt the committed domain event; never publish private notes, code or answers to a queue.
create function private.platform_attempt_event() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into private.platform_jobs(event_id,workspace_id,user_id,kind,source_id,environment,correlation_id,causation_id)
 values(new.id,new.workspace_id,new.user_id,'attempt.observe',new.id,'production',new.id,new.id) on conflict(kind,source_id) do nothing;
 return new;
end $$;
create trigger platform_attempt_outbox after insert on public.attempt_outbox_events for each row execute function private.platform_attempt_event();

-- A workspace cannot disappear while it still owns bytes. Account deletion uses the same staged purge.
create function private.platform_workspace_delete_guard() returns trigger language plpgsql security definer set search_path='' as $$begin
 if exists(select 1 from public.files where workspace_id=old.id and status<>'DELETED') then raise exception 'Delete private files and wait for storage cleanup before deleting this workspace' using errcode='23503';end if;
 delete from public.files where workspace_id=old.id and status='DELETED';return old;
end $$;
create trigger platform_workspace_delete before delete on public.workspaces for each row execute function private.platform_workspace_delete_guard();
-- Worker operations use the service identity plus a short-lived, one-use database grant.
create function private.platform_worker(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare operation text:=p_command->>'kind';env text:=p_command->>'environment';f public.files%rowtype;g private.file_operations%rowtype;j private.platform_jobs%rowtype;outbox jsonb:='[]'::jsonb;token uuid;source_event public.attempt_outbox_events%rowtype;begin
 perform private.platform_service();
 if env is null or env not in ('production','preview') or jsonb_typeof(p_command) is distinct from 'object' or octet_length(p_command::text)>16000 then raise exception 'Invalid platform worker request' using errcode='22023';end if;
 if operation='file.claim' then
  if coalesce(p_command->>'token','')!~'^[a-f0-9]{64}$' or p_command->>'purpose' not in ('upload','download') then return jsonb_build_object('state','denied');end if;
  select * into g from private.file_operations where token_hash=encode(sha256(convert_to(p_command->>'token','UTF8')),'hex');if g.id is null then return jsonb_build_object('state','denied');end if;
  select * into f from public.files where id=g.file_id for update;
  select * into g from private.file_operations where id=g.id for update;
  if f.environment<>env or g.expires_at<=now() or g.kind<>p_command->>'purpose' or not exists(select 1 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id where w.id=f.workspace_id and w.status='active' and m.user_id=f.owner_user_id and m.status='active') then return jsonb_build_object('state','denied');end if;
  if g.kind='upload' and f.status='READY' and g.consumed_at is not null then return jsonb_build_object('state','done','fileId',f.id);end if;
  if g.consumed_at is not null or g.attempts>=3 or (g.kind='upload' and f.status<>'PENDING_UPLOAD') or (g.kind='download' and f.status<>'READY') then return jsonb_build_object('state','denied');end if;
  if g.lease_until>now() then return jsonb_build_object('state','busy');end if;
  token:=gen_random_uuid();update private.file_operations set attempts=attempts+1,lease_token=token,lease_until=now()+interval '2 minutes',consumed_at=case when kind='download' then now() end where id=g.id;
  return jsonb_build_object('state','claimed','operationId',g.id,'leaseToken',token,'file',jsonb_build_object('id',f.id,'workspaceId',f.workspace_id,'userId',f.owner_user_id,'bucket',f.bucket,'key',f.object_key,'name',f.original_filename,'mime',f.mime_type,'bytes',f.size_bytes,'checksum',f.checksum));
 elsif operation='file.finish' then
  select * into g from private.file_operations where id=(p_command->>'operationId')::uuid;
  if g.id is null then return jsonb_build_object('state','stale');end if;
  select * into f from public.files where id=g.file_id for update;select * into g from private.file_operations where id=g.id for update;
  if f.environment<>env or g.lease_token is distinct from (p_command->>'leaseToken')::uuid or g.kind<>'upload' then return jsonb_build_object('state','stale');end if;
  if f.status='READY' and g.consumed_at is not null then return jsonb_build_object('state','ready','duplicate',true);end if;
  if f.status<>'PENDING_UPLOAD' or g.consumed_at is not null or g.lease_until<=now() or not exists(select 1 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id where w.id=f.workspace_id and w.status='active' and m.user_id=f.owner_user_id and m.status='active') then return jsonb_build_object('state','stale');end if;
  if p_command->>'status'='ready' then
   if p_command->>'checksum' is distinct from f.checksum or (p_command->>'bytes')::bigint is distinct from f.size_bytes or length(coalesce(p_command->>'etag','')) not between 1 and 160 then raise exception 'Object verification failed' using errcode='22023';end if;
   update public.files set status='READY',etag=p_command->>'etag',version=version+1,updated_at=now(),last_checked_at=now(),failure_code=null where id=f.id;
   update private.file_operations set consumed_at=now(),lease_until=null where id=g.id;
   insert into public.platform_audit(actor_id,workspace_id,target_id,action,request_id,metadata) values(f.owner_user_id,f.workspace_id,f.id,'file.ready',g.request_id,jsonb_build_object('bytes',f.size_bytes));return jsonb_build_object('state','ready');
  end if;
  update private.file_operations set lease_until=null where id=g.id;
  if p_command->>'code' in ('mime_invalid','checksum_mismatch','size_mismatch') then update public.files set status='FAILED',failure_code=p_command->>'code',version=version+1,updated_at=now() where id=f.id;update private.file_operations set consumed_at=now() where id=g.id;insert into public.platform_audit(actor_id,workspace_id,target_id,action,request_id,metadata) values(f.owner_user_id,f.workspace_id,f.id,'file.upload_failed',g.request_id,jsonb_build_object('code',p_command->>'code'));end if;
  return jsonb_build_object('state','failed');
 elsif operation='dispatch' then
  update private.platform_runtime set files_enabled=true,last_dispatch_at=now(),last_success_at=now() where environment=env;
  for f in select * from public.files where environment=env and status='PENDING_UPLOAD' and created_at<now()-interval '1 hour' order by created_at limit 5 for update skip locked loop
   update public.files set status='DELETING',failure_code='upload_expired',version=version+1,updated_at=now() where id=f.id;
   insert into private.platform_jobs(workspace_id,user_id,kind,source_id,environment,correlation_id) values(f.workspace_id,f.owner_user_id,'file.delete',f.id,env,gen_random_uuid()) on conflict(kind,source_id) do nothing;
   insert into public.platform_audit(actor_id,workspace_id,target_id,action,request_id) values(f.owner_user_id,f.workspace_id,f.id,'file.upload_expired',gen_random_uuid());
  end loop;
  update private.platform_jobs set status='failed',failure_code='retry_exhausted',completed_at=now() where environment=env and status in ('pending','publishing','processing','queued') and coalesce(lease_until,available_at)<now() and (attempt_count>=6 or publish_attempts>=12);
  for j in select * from private.platform_jobs where environment=env and available_at<=now() and (status='pending' or status in ('publishing','processing','queued') and lease_until<now()) and attempt_count<6 and publish_attempts<12 order by available_at,id limit 5 for update skip locked loop
   token:=gen_random_uuid();update private.platform_jobs set status='publishing',lease_token=token,lease_until=now()+interval '2 minutes',publish_attempts=publish_attempts+1 where id=j.id;
   outbox:=outbox||jsonb_build_array(jsonb_build_object('id',j.id,'eventId',j.event_id,'workspaceId',j.workspace_id,'userId',j.user_id,'kind',j.kind,'sourceId',j.source_id,'correlationId',j.correlation_id,'causationId',j.causation_id,'occurredAt',j.created_at,'leaseToken',token));
  end loop;return outbox;
 elsif operation='job.published' then
  update private.platform_jobs set status='queued',lease_until=now()+interval '15 minutes' where id=(p_command->>'id')::uuid and environment=env and status='publishing' and lease_token=(p_command->>'leaseToken')::uuid;return jsonb_build_object('saved',found);
 elsif operation='job.claim' then
  select * into j from private.platform_jobs where id=(p_command->>'id')::uuid and environment=env for update skip locked;
  if j.id is null then return jsonb_build_object('state','gone');end if;
  if j.status in ('done','failed','suppressed') then return jsonb_build_object('state','done');end if;
  if j.status='processing' and j.lease_until>now() then return jsonb_build_object('state','busy');end if;
  if j.event_id is distinct from (p_command->>'eventId')::uuid or j.kind is distinct from p_command->>'jobKind' then return jsonb_build_object('state','denied');end if;
  if j.kind='attempt.observe' then
   select * into source_event from public.attempt_outbox_events where id=j.source_id and workspace_id=j.workspace_id and user_id=j.user_id;
   if source_event.id is null or not exists(select 1 from public.question_attempts where id=source_event.attempt_id and workspace_id=j.workspace_id and user_id=j.user_id and reflection_status='completed') then update private.platform_jobs set status='suppressed',failure_code='source_unavailable',completed_at=now() where id=j.id;return jsonb_build_object('state','done');end if;
   insert into private.processed_events(consumer_name,event_id,result_status) values('attempt-observer-v1',j.event_id,'processed') on conflict do nothing;
   update private.platform_jobs set status='done',completed_at=now() where id=j.id;return jsonb_build_object('state','done');
  end if;
  select * into f from public.files where id=j.source_id for update;
  if f.id is null or f.status<>'DELETING' then update private.platform_jobs set status='suppressed',failure_code='source_unavailable',completed_at=now() where id=j.id;return jsonb_build_object('state','done');end if;
  token:=gen_random_uuid();update private.platform_jobs set status='processing',lease_token=token,lease_until=now()+interval '2 minutes',attempt_count=attempt_count+1 where id=j.id;
  return jsonb_build_object('state','claimed','id',j.id,'leaseToken',token,'fileId',f.id,'key',f.object_key,'bucket',f.bucket);
 elsif operation='job.finished' then
  select * into j from private.platform_jobs where id=(p_command->>'id')::uuid and environment=env and status='processing' and lease_token=(p_command->>'leaseToken')::uuid for update;
  if j.id is null then return jsonb_build_object('state','stale');end if;
  update public.files set status='DELETED',deleted_at=now(),version=version+1,updated_at=now() where id=j.source_id and status='DELETING';
  insert into private.processed_events(consumer_name,event_id,result_status) values('file-delete-v1',j.event_id,'processed') on conflict do nothing;
  insert into public.platform_audit(actor_id,workspace_id,target_id,action,request_id) values(j.user_id,j.workspace_id,j.source_id,'file.deleted',j.correlation_id);
  update private.platform_jobs set status='done',lease_until=null,completed_at=now() where id=j.id;return jsonb_build_object('state','done');
 elsif operation='job.failed' then
  update private.platform_jobs set status='failed',failure_code='queue_exhausted',completed_at=now(),lease_until=null where id=(p_command->>'id')::uuid and environment=env and status not in ('done','suppressed');return jsonb_build_object('saved',found);
 elsif operation='reconcile.claim' then
  for f in select * from public.files where environment=env and status='READY' and last_checked_at<now()-interval '1 hour' order by last_checked_at,id limit 5 for update skip locked loop
   update public.files set last_checked_at=now() where id=f.id;
   outbox:=outbox||jsonb_build_array(jsonb_build_object('id',f.id,'key',f.object_key,'bytes',f.size_bytes,'checksum',f.checksum));
  end loop;return outbox;
 elsif operation='reconcile.missing' then
  update public.files set status='FAILED',failure_code='object_missing',version=version+1,updated_at=now() where id=(p_command->>'id')::uuid and environment=env and status='READY' returning * into f;
  if found then insert into public.platform_audit(actor_id,workspace_id,target_id,action,request_id) values(f.owner_user_id,f.workspace_id,f.id,'file.missing',gen_random_uuid());end if;
  return jsonb_build_object('saved',found);
 elsif operation='orphan.cursor' then
  return jsonb_build_object('cursor',(select list_cursor from private.platform_runtime where environment=env));
 elsif operation='orphan.observe' then
  if length(coalesce(p_command->>'key','')) not between 1 and 1024 then raise exception 'Invalid object key' using errcode='22023';end if;
  if not exists(select 1 from public.files where object_key=p_command->>'key' and environment=env and status<>'DELETED') then
   insert into private.file_orphan_observations(object_key,environment,size_bytes) values(p_command->>'key',env,(p_command->>'bytes')::bigint) on conflict(object_key) do update set last_seen_at=now();
  end if;return jsonb_build_object('saved',true);
 elsif operation='orphan.checkpoint' then
  update private.platform_runtime set list_cursor=nullif(p_command->>'cursor',''),orphan_scan_at=now() where environment=env;return jsonb_build_object('saved',true);
 elsif operation='stats' then
  return jsonb_build_object('runtime',(select jsonb_build_object('filesEnabled',files_enabled,'lastDispatchAt',last_dispatch_at,'lastSuccessAt',last_success_at) from private.platform_runtime where environment=env),'jobs',(select jsonb_object_agg(x.status,x.n) from(select status,count(*) n from private.platform_jobs where environment=env group by status)x),'oldestDueSeconds',(select greatest(0,extract(epoch from now()-min(available_at))) from private.platform_jobs where environment=env and status='pending'));
 else raise exception 'Unknown platform operation' using errcode='22023';end if;
end $$;
create function private.platform_file_command(p_slug text,p_request uuid,p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;actor uuid:=(select auth.uid());f public.files%rowtype;operation text:=p_command->>'kind';token text;environment_name text:=coalesce(p_command->>'environment','production');operation_id uuid;begin
 w:=private.platform_access(p_slug,operation in ('upload','delete'));
 if p_request is null or jsonb_typeof(p_command) is distinct from 'object' or octet_length(p_command::text)>4000 then raise exception 'Invalid file command' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtext('platform-files:'||actor::text));
 if(select count(*) from public.platform_audit where actor_id=actor and created_at>now()-interval '1 minute')>=30 then raise exception 'Please wait before requesting more file operations' using errcode='P0001';end if;
 if operation='upload' then
  if environment_name not in ('production','preview') or not coalesce((select files_enabled from private.platform_runtime where environment=environment_name),false) then raise exception 'File storage is not available yet' using errcode='22023';end if;
  if (select count(*) from public.files where owner_user_id=actor and workspace_id=w.id and status<>'DELETED')>=100 then raise exception 'This workspace supports 100 private files' using errcode='22023';end if;
  if (select coalesce(sum(size_bytes),0) from public.files where owner_user_id=actor and status<>'DELETED')+coalesce((p_command->>'bytes')::bigint,0)>104857600 then raise exception 'Your private file allowance is 100 MB' using errcode='22023';end if;
  if exists(select 1 from public.platform_audit where actor_id=actor and request_id=p_request and action='file.upload_requested') then raise exception 'Upload request already exists. Refresh your file list.' using errcode='40001';end if;
  if p_command->>'category' not in ('resume','attachment') then raise exception 'Choose a supported upload category' using errcode='22023';end if;
  insert into public.files(workspace_id,owner_user_id,environment,bucket,object_key,original_filename,display_name,category,mime_type,size_bytes,checksum)
   values(w.id,actor,environment_name,case environment_name when 'production' then 'prepcraft-private-files' else 'prepcraft-preview-files' end,'workspaces/'||w.id||'/files/'||gen_random_uuid()||'/source',p_command->>'name',p_command->>'name',p_command->>'category',p_command->>'mime',(p_command->>'bytes')::bigint,p_command->>'checksum') returning * into f;
  if f.mime_type not in ('application/pdf','image/png','image/jpeg','text/plain') then raise exception 'Unsupported file type' using errcode='22023';end if;
  insert into public.platform_audit(actor_id,workspace_id,target_id,action,request_id,metadata) values(actor,w.id,f.id,'file.upload_requested',p_request,jsonb_build_object('category',f.category,'mime',f.mime_type,'bytes',f.size_bytes));
 elsif operation in ('download','delete') then
  select * into f from public.files where id=(p_command->>'id')::uuid and workspace_id=w.id and owner_user_id=actor for update;
  if f.id is null then raise exception 'File not found' using errcode='42501';end if;
  if operation='download' and f.status<>'READY' then raise exception 'This file is not available for download' using errcode='22023';end if;
  if operation='delete' then
   if f.status in ('DELETING','DELETED') then return jsonb_build_object('file',private.platform_file_json(f),'duplicate',true);end if;
   if (p_command->>'version') is null or f.version is distinct from (p_command->>'version')::integer then raise exception 'This file changed. Refresh before deleting.' using errcode='40001';end if;
   update public.files set status='DELETING',version=version+1,updated_at=now() where id=f.id returning * into f;
   update private.file_operations set consumed_at=now() where file_id=f.id and consumed_at is null;
   insert into private.platform_jobs(workspace_id,user_id,kind,source_id,environment,correlation_id) values(w.id,actor,'file.delete',f.id,f.environment,p_request) on conflict(kind,source_id) do nothing;
   insert into public.platform_audit(actor_id,workspace_id,target_id,action,request_id) values(actor,w.id,f.id,'file.delete_requested',p_request);
   return jsonb_build_object('file',private.platform_file_json(f));
  end if;
  insert into public.platform_audit(actor_id,workspace_id,target_id,action,request_id) values(actor,w.id,f.id,'file.download_authorized',p_request);
 else raise exception 'Unknown file operation' using errcode='22023';end if;
 token:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
 insert into private.file_operations(file_id,workspace_id,user_id,kind,token_hash,expires_at,request_id) values(f.id,w.id,actor,operation,encode(sha256(convert_to(token,'UTF8')),'hex'),now()+case when operation='download' then interval '1 minute' else interval '5 minutes' end,p_request) returning id into operation_id;
 return jsonb_build_object('file',private.platform_file_json(f),'operationId',operation_id,'token',token,'expiresIn',case when operation='download' then 60 else 300 end);
end $$;

-- Only invoker facades are exposed by PostgREST. Private implementations verify identity again.
create function public.platform_files(p_slug text,p_cursor jsonb default null) returns jsonb language sql security invoker set search_path='' as $$select private.platform_file_list(p_slug,p_cursor)$$;
create function public.platform_file_command(p_slug text,p_request uuid,p_command jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.platform_file_command(p_slug,p_request,p_command)$$;
create function public.platform_worker(p_command jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.platform_worker(p_command)$$;
revoke all on function private.platform_access(text,boolean),private.platform_service(),private.platform_file_json(public.files),private.platform_file_list(text,jsonb),private.platform_file_command(text,uuid,jsonb),private.platform_worker(jsonb),private.platform_attempt_event(),private.platform_workspace_delete_guard() from public,anon,authenticated,service_role;
revoke all on function public.platform_files(text,jsonb),public.platform_file_command(text,uuid,jsonb),public.platform_worker(jsonb) from public,anon,authenticated,service_role;
grant usage on schema private to authenticated,service_role;
grant execute on function public.platform_files(text,jsonb),public.platform_file_command(text,uuid,jsonb),private.platform_file_list(text,jsonb),private.platform_file_command(text,uuid,jsonb) to authenticated;
grant execute on function public.platform_worker(jsonb),private.platform_worker(jsonb) to service_role;
comment on table public.files is 'Private R2 metadata; only the owning current workspace member may read. No durable access URLs.';
comment on table private.platform_jobs is 'Durable, bounded, leased adapter over canonical domain events. No user content.';
