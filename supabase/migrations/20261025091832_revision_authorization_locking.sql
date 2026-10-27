-- Serialize live workspace authorization with personal learning mutations.
-- Read-only queue/detail queries retain ordinary MVCC reads.
create or replace function private.revision_access(p_slug text,p_write boolean default false) returns public.workspaces
language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;begin
 if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_write then
  select * into w from public.workspaces where slug=p_slug for update;
 else
  select * into w from public.workspaces where slug=p_slug;
 end if;
 if w.id is null or (p_write and w.status<>'active') then raise exception 'Workspace unavailable or read-only' using errcode='42501';end if;
 if p_write then
  perform 1 from public.workspace_members where workspace_id=w.id and user_id=(select auth.uid()) and status='active' for share;
  if not found then raise exception 'Workspace unavailable or read-only' using errcode='42501';end if;
 elsif not exists(select 1 from public.workspace_members where workspace_id=w.id and user_id=(select auth.uid()) and status='active') then
  raise exception 'Workspace unavailable' using errcode='42501';
 end if;
 return w;
end $$;
revoke all on function private.revision_access(text,boolean) from public,anon,authenticated,service_role;
