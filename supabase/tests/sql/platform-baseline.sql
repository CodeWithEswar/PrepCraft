begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(3);
select has_schema('public', 'Public application schema is available');
select has_schema('auth', 'Supabase owns authentication');
select ok(exists(select 1 from pg_roles where rolname = 'authenticated'), 'Authenticated role is available for future RLS tests');
select * from finish();
rollback;
