select c.relname,c.relrowsecurity,c.relforcerowsecurity,
  has_table_privilege('authenticated',c.oid,'SELECT') as member_read,
  has_table_privilege('authenticated',c.oid,'UPDATE') as direct_update,
  has_table_privilege('anon',c.oid,'SELECT') as anonymous_read
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('planning_state','weekly_goals','weekly_goal_items','planning_availability','planning_availability_overrides','weekly_reviews','planning_activity_events') order by c.relname;
