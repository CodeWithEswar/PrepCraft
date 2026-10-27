-- Metadata/canonical publication counts only. No workspace notes, answers or user records.
select jsonb_build_object(
 'tables',(select jsonb_agg(jsonb_build_object('name',relname,'rls',relrowsecurity,'forced',relforcerowsecurity,'authenticatedRead',has_table_privilege('authenticated',oid,'SELECT'),'directWrite',has_table_privilege('authenticated',oid,'UPDATE'),'anonymousRead',has_table_privilege('anon',oid,'SELECT')) order by relname) from pg_class where relnamespace='public'::regnamespace and relname in ('learning_subjects','learning_topic_catalog','learning_concepts','learning_concept_relations','learning_activities','workspace_learning_state','learning_execution_bindings')),
 'subjects',(select count(*) from public.learning_subjects),
 'publishedConcepts',(select count(*) from public.learning_concepts where status='published'),
 'publishedActivities',(select count(*) from public.learning_activities where status='published'),
 'privateAnswers',not has_table_privilege('authenticated','private.learning_answer_keys','SELECT'),
 'anonymousSubmitDenied',not has_function_privilege('anon','public.learning_submit(text,uuid,integer,jsonb,integer,text[])','EXECUTE'),
 'anonymousCatalogDenied',not has_function_privilege('anon','public.learning_catalog(text,text,text,text,text,boolean)','EXECUTE'),
 'evaluatorGuard',exists(select 1 from pg_trigger where tgname='learning_evidence_validation' and not tgisinternal),
 'immutableKeys',exists(select 1 from pg_trigger where tgname='learning_key_version' and not tgisinternal),
 'sharedMasteryVerifiedEvidence',position('learning_execution_bindings' in pg_get_functiondef('private.mastery_evidence(text,integer,timestamptz)'::regprocedure))>0,
 'earlyPracticeDoesNotAdvance',position('EARLY_PRACTICE_NO_ADVANCE' in pg_get_functiondef('private.consume_revision_attempt(uuid)'::regprocedure))>0,
 'earlyPracticeExcludedFromMastery',position('EARLY_PRACTICE_NO_ADVANCE' in pg_get_functiondef('private.mastery_evidence(text,integer,timestamptz)'::regprocedure))>0,
 'sharedRevisionTrigger',exists(select 1 from pg_trigger where tgname='revision_on_attempt_committed' and not tgisinternal)
) as verification;
