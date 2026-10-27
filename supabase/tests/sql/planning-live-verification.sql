-- Read-only deployment verification. No user data or secret values are returned.
select c.relname,c.relrowsecurity,c.relforcerowsecurity,
  has_table_privilege('authenticated',c.oid,'SELECT') as member_read,
  has_table_privilege('authenticated',c.oid,'UPDATE') as direct_update,
  has_table_privilege('anon',c.oid,'SELECT') as anonymous_read
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('planning_state','weekly_goals','weekly_goal_items','planning_availability','planning_availability_overrides','weekly_reviews','planning_activity_events') order by c.relname;
select
  position('action=''carry'' and task.status=''in_progress''' in pg_get_functiondef('private.mutate_planning(text,date,bigint,uuid,text,jsonb)'::regprocedure))>0 as explicit_active_carryover,
  position('is distinct from ''capacity-v1''' in pg_get_functiondef('private.mutate_planning(text,date,bigint,uuid,text,jsonb)'::regprocedure))>0 as proposal_policy_validation,
  position('private.planning_capacity' in pg_get_functiondef('private.mutate_today(text,date,jsonb)'::regprocedure))>0 as today_capacity_checked,
  position('carryover_from_task_id' in pg_get_functiondef('private.mutate_today(text,date,jsonb)'::regprocedure))>0 as today_lineage_preserved,
  exists(select 1 from pg_trigger where tgname='protect_closed_planning_history' and not tgisinternal) as closed_history_guard;
