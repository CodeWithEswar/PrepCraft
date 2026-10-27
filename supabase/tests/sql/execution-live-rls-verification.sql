select c.relname,c.relrowsecurity,c.relforcerowsecurity,
  has_table_privilege('authenticated',c.oid,'SELECT') as owner_read,
  has_table_privilege('authenticated',c.oid,'UPDATE') as direct_update,
  has_table_privilege('anon',c.oid,'SELECT') as anonymous_read
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('execution_sessions','execution_session_items','execution_item_hints','execution_hint_uses','execution_focus_intervals','question_attempts','execution_events','attempt_outbox_events') order by c.relname;
