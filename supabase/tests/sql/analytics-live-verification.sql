-- Read-only permission/contract verification; no production preparation records are selected.
begin;
do $$declare sig text;begin
 foreach sig in array array['analytics_core(text,jsonb)','analytics_activity(text,jsonb)','analytics_interviews(text,jsonb,integer)','analytics_history(text,jsonb,text,jsonb)'] loop
  if not has_function_privilege('authenticated','public.'||sig,'EXECUTE') or has_function_privilege('anon','public.'||sig,'EXECUTE') then raise exception 'Analytics facade privilege mismatch: %',sig;end if;
  if not has_function_privilege('authenticated','private.'||sig,'EXECUTE') or has_function_privilege('anon','private.'||sig,'EXECUTE') then raise exception 'Analytics private entry privilege mismatch: %',sig;end if;
 end loop;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'analytics_%' and p.prosecdef) then raise exception 'Analytics facade must be invoker';end if;
 foreach sig in array array['analytics_context(text,jsonb)','analytics_attempt_rows(jsonb,text)','analytics_stats(jsonb)'] loop
  if has_function_privilege('authenticated','private.'||sig,'EXECUTE') or has_function_privilege('anon','private.'||sig,'EXECUTE') then raise exception 'Analytics helper exposed: %',sig;end if;
 end loop;
 if (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname like 'analytics_%' and p.prosecdef and p.proconfig @> array['search_path=""'])<>6 then raise exception 'Analytics search-path or private definer contract mismatch';end if;
 if to_regclass('public.analytics_attempt_terminal_time') is null or to_regclass('public.analytics_session_terminal_time') is null then raise exception 'Analytics terminal indexes missing';end if;
 begin perform public.analytics_core('not-a-real-workspace','{}');raise exception 'Unauthenticated analytics was allowed';exception when insufficient_privilege then null;end;
end $$;
select jsonb_build_object('facades',4,'guardedPrivateFunctions',6,'helperAccessRevoked',true,'anonymousAccess',false,'analyticsTruthTables',0,'personalDataRead',false) verification;
rollback;
