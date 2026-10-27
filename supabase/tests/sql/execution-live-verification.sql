-- Read-only deployment assertions; no user session data is returned.
select
  to_regprocedure('public.execution_task_links(uuid,uuid[])') is not null as task_resume_contract,
  position('Invalid question examples' in pg_get_functiondef('private.create_execution(text,uuid,jsonb)'::regprocedure))>0 as prompt_shape_validation,
  position('private.execution_week_minutes' in pg_get_functiondef('private.mutate_planning(text,date,bigint,uuid,text,jsonb)'::regprocedure))>0 as recorded_week_review_time,
  exists(select 1 from pg_constraint where conrelid='public.execution_events'::regclass and confrelid='public.execution_session_items'::regclass and contype='f') as event_item_scope_fk,
  position('prior.event_type=''expired''' in pg_get_functiondef('private.mutate_execution(text,uuid,integer,uuid,jsonb)'::regprocedure))>0 as expired_retry_stays_rejected;
