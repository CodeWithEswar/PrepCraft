-- Metadata only; no learning evidence.
select jsonb_build_object('tables',(select jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,'forced',c.relforcerowsecurity,'ownerRead',has_table_privilege('authenticated',c.oid,'SELECT'),'directUpdate',has_table_privilege('authenticated',c.oid,'UPDATE'),'anonymousRead',has_table_privilege('anon',c.oid,'SELECT'))) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('revision_items','revision_attempts','revision_snoozes','revision_execution_links','revision_events')),
'committedAttemptTrigger',exists(select 1 from pg_trigger where tgname='revision_on_attempt_committed' and tgenabled='O'),
'noAnonymousRpc',not has_function_privilege('anon','public.revision_queue(text,jsonb,jsonb)','EXECUTE'),
'internalConsumerPrivate',not has_function_privilege('authenticated','private.consume_revision_attempt(uuid)','EXECUTE')) as verification;
