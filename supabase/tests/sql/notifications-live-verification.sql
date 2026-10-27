-- Metadata and negative authorization checks only. No personal preparation rows are read.
begin;
do $$declare name text;sig text;begin
 foreach name in array array['reminders','reminder_schedules','reminder_occurrences','notifications','notification_deliveries','notification_preferences','weekly_reports','push_subscriptions','notification_actions'] loop
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=name and c.relrowsecurity and c.relforcerowsecurity) then raise exception 'Missing forced RLS: %',name;end if;
  if not has_table_privilege('authenticated','public.'||name,'SELECT') or has_table_privilege('anon','public.'||name,'SELECT') or has_table_privilege('authenticated','public.'||name,'INSERT') or has_table_privilege('authenticated','public.'||name,'UPDATE') then raise exception 'Invalid table grants: %',name;end if;
 end loop;
 foreach sig in array array['notification_inbox(text,jsonb,jsonb,integer)','notification_settings(text)','notification_detail(text,uuid)','notification_report(text,uuid)','notification_check(text)','notification_command(text,uuid,jsonb)','notification_schedule_preview(text,jsonb,text,uuid)'] loop
  if not has_function_privilege('authenticated','public.'||sig,'EXECUTE') or has_function_privilege('anon','public.'||sig,'EXECUTE') or has_function_privilege('service_role','public.'||sig,'EXECUTE') then raise exception 'Invalid facade grants: %',sig;end if;
 end loop;
 if has_function_privilege('authenticated','public.notification_worker(jsonb)','EXECUTE') or has_function_privilege('anon','public.notification_worker(jsonb)','EXECUTE') or not has_function_privilege('service_role','public.notification_worker(jsonb)','EXECUTE') then raise exception 'Worker boundary exposed';end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'notification_%' and p.prosecdef) then raise exception 'Public notification facade must be invoker';end if;
 if has_function_privilege('authenticated','private.notification_publish_report(uuid)','EXECUTE') or has_function_privilege('authenticated','private.notification_emit(public.reminders,text,timestamptz,jsonb,uuid)','EXECUTE') then raise exception 'Private mutation helper exposed';end if;
 if has_table_privilege('authenticated','private.notification_push_credentials','SELECT') or has_table_privilege('service_role','private.notification_push_credentials','SELECT') then raise exception 'Push credentials directly exposed';end if;
 if not exists(select 1 from pg_indexes where indexname='notifications_inbox') or not exists(select 1 from pg_indexes where indexname='notification_outbox_due') then raise exception 'Dispatch or cursor index missing';end if;
 begin perform public.notification_inbox('not-a-workspace');raise exception 'Anonymous inbox allowed';exception when insufficient_privilege then null;end;
 begin perform private.notification_worker('{"kind":"ops.stats"}');raise exception 'Non-service worker access allowed';exception when insufficient_privilege then null;end;
end $$;
select jsonb_build_object('rlsTables',9,'userFacades',7,'publicDefiners',0,'privateCredentialsExposed',false,'anonymousAccess',false,'personalDataRead',false) verification;
rollback;
