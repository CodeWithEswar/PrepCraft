begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(1);
-- A baseline guard, not a substitute for per-feature authorization fixtures.
-- Extension-owned tables are not application tables.
select is_empty($$
  select n.nspname || '.' || c.relname
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and not c.relrowsecurity
    and not exists (
      select 1 from pg_depend d
      where d.classid = 'pg_class'::regclass and d.objid = c.oid and d.deptype = 'e'
    )
$$, 'Every application table in the exposed public schema has RLS enabled');
select * from finish();
rollback;
