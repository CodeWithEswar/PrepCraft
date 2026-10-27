-- Index the actual FK lookup paths used by deletion and authorization reconciliation.
create index files_workspace_fk on public.files(workspace_id);
create index file_operations_file_fk on private.file_operations(file_id,workspace_id,user_id);
create index platform_jobs_workspace_fk on private.platform_jobs(workspace_id);
create index platform_audit_workspace_fk on public.platform_audit(workspace_id);

-- Explicit operator replay keeps the original event identity and has a bounded audit reason.
create function private.platform_replay(p_id uuid,p_request uuid,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare j private.platform_jobs%rowtype;begin
 perform private.platform_service();
 if p_request is null or p_reason is null or p_reason not in ('dependency_recovered','configuration_fixed','operator_reviewed') then raise exception 'Choose a bounded recovery reason' using errcode='22023';end if;
 select * into j from private.platform_jobs where id=p_id for update;
 if j.id is null then raise exception 'Job not found' using errcode='22023';end if;
 if j.status<>'failed' then return jsonb_build_object('replayed',false,'state',j.status);end if;
 insert into public.platform_audit(actor_id,workspace_id,target_id,action,request_id,metadata) values(j.user_id,j.workspace_id,j.id,'job.failed',p_request,jsonb_build_object('operation','replay','reason',p_reason,'eventId',j.event_id));
 update private.platform_jobs set status='pending',attempt_count=0,publish_attempts=0,available_at=now(),lease_until=null,lease_token=null,failure_code=null,completed_at=null where id=j.id;
 return jsonb_build_object('replayed',true,'eventId',j.event_id);
end $$;
create function public.platform_replay(p_id uuid,p_request uuid,p_reason text) returns jsonb language sql security invoker set search_path='' as $$select private.platform_replay(p_id,p_request,p_reason)$$;
revoke all on function public.platform_replay(uuid,uuid,text),private.platform_replay(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.platform_replay(uuid,uuid,text),private.platform_replay(uuid,uuid,text) to service_role;
