-- Metadata only; no private source records.
select jsonb_build_object('rls',(select jsonb_build_object('enabled',relrowsecurity,'forced',relforcerowsecurity,'ownerRead',has_table_privilege('authenticated',oid,'SELECT'),'directUpdate',has_table_privilege('authenticated',oid,'UPDATE'),'anonymousRead',has_table_privilege('anon',oid,'SELECT')) from pg_class where oid='public.execution_topic_attributions'::regclass),
'aggregateContract',to_regprocedure('public.mastery_evidence(text,integer,timestamptz)') is not null,
'paginatedSpine',to_regprocedure('public.mastery_spine(text,text,text,jsonb)') is not null,
'noAnonymousAggregate',not has_function_privilege('anon','public.mastery_evidence(text,integer,timestamptz)','EXECUTE'),
'noAnonymousAttribution',not has_function_privilege('anon','public.assign_execution_topic(text,uuid,text)','EXECUTE'),
'atomicLaunchAttribution',position('private.assign_execution_topic' in pg_get_functiondef('private.create_execution(text,uuid,jsonb)'::regprocedure))>0,
'completedEvidenceIndex',exists(select 1 from pg_indexes where schemaname='public' and indexname='mastery_completed_evidence')) as verification;
