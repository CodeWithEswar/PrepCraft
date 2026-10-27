-- Read-only post-deployment checks. No user story text or production evidence is read.
begin;
do $$
declare t text;tables text[]:=array['behavioral_frameworks','behavioral_principles','behavioral_prompts','behavioral_prompt_principles','template_behavioral_frameworks','workspace_behavioral_settings','star_stories','star_story_principles','behavioral_practice_bindings','behavioral_events'];
begin
 foreach t in array tables loop
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=t and c.relrowsecurity and c.relforcerowsecurity) then raise exception 'Behavioral RLS missing: %',t;end if;
  if has_table_privilege('anon','public.'||t,'SELECT') or has_table_privilege('authenticated','public.'||t,'INSERT,UPDATE,DELETE') then raise exception 'Unexpected Behavioral table privilege: %',t;end if;
 end loop;
 if (select count(*) from public.behavioral_principles where framework_id='general-behavioral' and framework_version=1)<>20 then raise exception 'General framework seed mismatch';end if;
 if (select count(*) from public.behavioral_principles where framework_id='amazon-leadership' and framework_version=1)<>16 then raise exception 'Amazon framework seed mismatch';end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'behavioral_%' and (p.prosecdef or has_function_privilege('anon',p.oid,'EXECUTE'))) then raise exception 'Behavioral function exposure mismatch';end if;
 if not exists(select 1 from pg_trigger where tgname='behavioral_evidence_validation') or not exists(select 1 from pg_trigger where tgname='behavioral_revision_route') then raise exception 'Behavioral evidence guard missing';end if;
 if strpos(pg_get_functiondef('private.mastery_evidence(text,integer,timestamptz)'::regprocedure),'not exists(select 1 from public.behavioral_practice_bindings')=0 then raise exception 'Mastery separation missing';end if;
end $$;
select jsonb_build_object('behavioralRlsTables',10,'generalCompetencies',20,'amazonPrinciples',16,'anonymousAccess',false,'directClientWrites',false,'sharedEvidenceGuards',true,'masterySeparated',true,'personalStoriesSeeded',false) as verification;
rollback;
