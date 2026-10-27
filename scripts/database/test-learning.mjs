import assert from "node:assert/strict"
import fs from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"
const db=new PGlite(),id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`
let checks=0,request=100
const check=(value,label)=>{assert(value,label);checks++}
const rejects=async(sql,args,code)=>{await assert.rejects(()=>db.query(sql,args),error=>{assert.equal(error.code,code,error.message);return true});checks++}
try{
await db.exec(`create role authenticated;create role anon;create role service_role;
create schema auth;create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema public,auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
create table workspaces(id uuid primary key,slug text,status text,timezone text,name text);
create table workspace_members(workspace_id uuid,user_id uuid,status text,role text);
create table workspace_targets(workspace_id uuid,template_id text,updated_at timestamptz);
create table workspace_preferences(workspace_id uuid,updated_at timestamptz,study_days text[],default_daily_minutes integer);
create table workspace_curricula(id uuid,workspace_id uuid,updated_at timestamptz);
create table workspace_curriculum_overrides(id uuid,workspace_id uuid);
create table tracks(id text primary key);create table topics(id text primary key,track_id text references tracks);create table patterns(id text primary key,name text);
create function public.is_workspace_member(p_workspace_id uuid) returns boolean language sql security definer stable set search_path='' as $$select exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=(select auth.uid()) and status='active')$$;
insert into auth.users values('${id(1)}'),('${id(2)}'),('${id(3)}');
insert into workspaces values('${id(11)}','one','active','UTC','One'),('${id(12)}','two','active','UTC','Two');
insert into workspace_members values('${id(11)}','${id(1)}','active','owner'),('${id(12)}','${id(2)}','active','owner'),('${id(11)}','${id(3)}','active','member');
insert into workspace_targets values('${id(11)}','general',now()),('${id(12)}','general',now());
insert into workspace_preferences values('${id(11)}',now(),array['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],120);
`)
await db.exec(`alter table workspace_targets add column template_version integer default 1;alter table workspace_curricula add column template_version_id uuid;
alter table workspace_curriculum_overrides add column entity_type text,add column entity_id text,add column override_type text,add column value jsonb;
create table preparation_template_versions(id uuid primary key,template_id text,version_number integer);
create table template_version_topics(template_version_id uuid,topic_id text);
insert into tracks values('dsa');insert into topics values('arrays','dsa'),('trees','dsa');insert into patterns values('sliding','Sliding Window');
insert into preparation_template_versions values('00000000-0000-4000-8000-000000000088','general',1);insert into template_version_topics values('00000000-0000-4000-8000-000000000088','arrays');
`)
const files=(await fs.readdir("supabase/migrations")).filter(file=>/_today_command_center.sql|_today_plan_review_safety.sql|_planning_capacity_goals_and_proposals.sql|_fix_active_planning_capacity.sql|_execution_engine_sessions.sql|_revision_retention_engine.sql|_execution_contract_hardening.sql|_revision_authorization_locking.sql|_mastery_evidence_aggregation.sql/.test(file)).sort()
for(const file of files){const sql=await fs.readFile(`supabase/migrations/${file}`,"utf8");try{await db.exec(sql)}catch(error){console.error({migration:file,position:error.position,near:sql.slice(Math.max(0,Number(error.position)-120),Number(error.position)+120)});throw error}}
await db.exec(`alter table tracks add column slug text,add column name text,add column description text,add column category text,add column sort_order integer,add column is_active boolean default true;
alter table topics add column slug text,add column name text,add column description text,add column importance_level text,add column sort_order integer,add column is_active boolean default true;
insert into tracks(id,name) values('programming-language','Language'),('databases-sql','Databases'),('cs-fundamentals','CS');`)
await db.exec(await fs.readFile('supabase/migrations/20261025105708_unified_learning_engine.sql','utf8'))
await db.exec(await fs.readFile('supabase/migrations/20261025120035_learning_early_practice_evidence.sql','utf8'))
await db.exec(await fs.readFile('supabase/migrations/20261025121332_learning_knowledge_bridges.sql','utf8'))

const login=async(user,role='authenticated')=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||'']);await db.exec('set role '+role)};
const rpc=async(name,args=[],types=[]) => (await db.query('select public.'+name+'('+args.map((_,i)=>'$'+(i+1)+(types[i]?'::'+types[i]:'')).join(',')+') result',args)).rows[0].result;
await login(id(1));
const catalog=await rpc('learning_catalog',['one']);check(catalog.subjects.length===5,'five subjects share one curriculum');check(catalog.topics.length===15,'structured aptitude topics');check(catalog.concepts.some(c=>c.status==='published'),'published first slice');
check(!(await db.query("select * from learning_concepts where status='draft'")).rows.length,'draft bodies protected');
await rejects('select * from private.learning_answer_keys',[],'42501');
await rejects('update learning_concepts set summary=$1',['tampered'],'42501');
check((await rpc('learning_concept',['one','learn-sql-dbms-transactions-core'])).relations.some(r=>r.id==='learn-operating-systems-synchronization-core'),'Knowledge Bridge connects shared-state concurrency concepts across subjects');
const cid='learn-aptitude-percentages-core',activity='learn-aptitude-percentages-check';
let concept=await rpc('learning_concept',['one',cid]);check(!JSON.stringify(concept).includes('solution'),'answer keys absent before submission');
let state=await rpc('learning_state',['one',cid,-1,id(request++),JSON.stringify({opened:true,bookmarked:true,note:'My private learning note'})],['text','text','integer','uuid','jsonb']);check(state.bookmarked&&state.version===0,'owned state persists');
await rejects('select public.learning_state($1,$2,$3,$4,$5::jsonb)',['one',cid,-1,id(request++),JSON.stringify({note:'stale'})],'40001');
let launch=await rpc('learning_launch',['one',activity,'practice',id(request++)]);check(!!launch.sessionId,'launch delegates to Execution');
let session=await rpc('learning_session',['one',launch.sessionId]);check(session.feedback===null,'no answer before submission');
const sid=session.execution.session.id,version=session.execution.session.version;
await rejects('select public.learning_submit($1,$2,$3,$4::jsonb,$5)',['one',sid,version,JSON.stringify('198'),3],'22023');
let saved=await rpc('learning_submit',['one',sid,version,JSON.stringify(198),4],['text','uuid','integer','jsonb','integer']);check(saved.binding.correct&&saved.feedback.solution,'numeric answer evaluated on server');check(saved.execution.attempts[0].reflection_status==='completed','same question_attempt committed');
let repeated=await rpc('learning_submit',['one',sid,version,JSON.stringify(198),4],['text','uuid','integer','jsonb','integer']);check(repeated.binding.submitted_at===saved.binding.submitted_at,'submission retry idempotent');
await rejects('select public.learning_submit($1,$2,$3,$4::jsonb,$5)',['one',sid,version,JSON.stringify(200),4],'40001');
let revision=(await db.query('select * from revision_items')).rows;check(revision.length===1,'shared Revision receives committed evidence');
let evidence=await rpc('mastery_evidence',['one',90]);check(evidence.totals.attempts===1,'verified short learning checks reach Mastery without faking time');
check(evidence.areas.some(a=>a.id==='learn-aptitude-percentages'),'Mastery receives real catalog metadata');
launch=await rpc('learning_launch',['one',activity,'practice',id(request++)]);session=await rpc('learning_session',['one',launch.sessionId]);saved=await rpc('learning_submit',['one',launch.sessionId,session.execution.session.version,JSON.stringify(200),5],['text','uuid','integer','jsonb','integer']);check(saved.binding.correct===false,'incorrect answer stays incorrect');
check((await db.query('select * from revision_items')).rows.length===1,'repeated activity keeps one stable revision identity');check((await db.query('select interval_days from revision_items')).rows[0].interval_days===1,'early repeat never advances the spacing ladder');
evidence=await rpc('mastery_evidence',['one',90]);check(evidence.groups[0].distinct_entities===1&&evidence.groups[0].initial_attempts===1,'repeating one question cannot invent coverage');check(evidence.totals.attempts===1&&evidence.totals.revisions===0,'early repeated assessment is excluded from Mastery solving and retention');
let order=await rpc('learning_launch',['one','learn-networks-tcp-check','practice',id(request++)]);session=await rpc('learning_session',['one',order.sessionId]);saved=await rpc('learning_submit',['one',order.sessionId,session.execution.session.version,JSON.stringify(['Client SYN','Server SYN-ACK','Client ACK']),3],['text','uuid','integer','jsonb','integer']);check(saved.binding.correct,'protocol ordering evaluates deterministically');
let mcq=await rpc('learning_launch',['one','learn-java-collections-framework-check','practice',id(request++)]);session=await rpc('learning_session',['one',mcq.sessionId]);saved=await rpc('learning_submit',['one',mcq.sessionId,session.execution.session.version,JSON.stringify('LinkedHashSet'),4],['text','uuid','integer','jsonb','integer']);check(saved.binding.correct,'Java conceptual activity');
let timed=await rpc('learning_launch',['one',activity,'timed',id(request++)]);await db.exec('reset role');await db.query("update execution_sessions set started_at=now()-interval '10 minutes',expires_at=now()-interval '7 minutes' where id=$1",[timed.sessionId]);await login(id(1));session=await rpc('learning_session',['one',timed.sessionId]);saved=await rpc('learning_submit',['one',timed.sessionId,session.execution.session.version,JSON.stringify(198),4],['text','uuid','integer','jsonb','integer']);check(saved.binding.timed_out&&!saved.binding.correct&&saved.binding.answer===null,'expired timed check discards late answer but commits timeout');

check((await db.query('select mistakes from question_attempts where item_id=$1',[saved.binding.item_id])).rows[0].mistakes.length===0,'wrong or timed-out answers do not invent a mistake diagnosis');
await rejects('update workspace_learning_state set note=$1',['overwrite'],'42501');
let stateRetry=await rpc('learning_state',['one',cid,state.version,id(request++),JSON.stringify({note:'Kept in one'})],['text','text','integer','uuid','jsonb']);check(stateRetry.note==='Kept in one','private note update versioned');
await rejects('select public.learning_state($1,$2,$3,$4,$5::jsonb)',['one',cid,null,id(request++),JSON.stringify({note:'null version'})],'40001');
for(const subject of ['java','sql-dbms','operating-systems','networks']){const track=await rpc('learning_catalog',['one',subject]);check(track.subjects.length===5&&track.topics.length>0,subject+' uses shared catalog');}
const search=await rpc('learning_catalog',['one','aptitude',null,'TCP']);check(search.concepts.some(c=>c.subject_id==='networks'),'search spans subjects with hierarchy');check(search.concepts.every(c=>c.status==='published'),'search does not expose draft lesson bodies');
const next=await rpc('learning_catalog',['one','aptitude',null,'TCP',search.concepts[0].id]);check(!next.concepts.some(c=>c.id===search.concepts[0].id),'keyset cursor excludes already delivered concept');
await rejects('select public.learning_concept($1,$2)',['one','learn-aptitude-percentages-percentage-fundamentals-planned'],'22023');
let bypass=await rpc('learning_launch',['one',activity,'practice',id(request++)]);let raw=await rpc('learning_session',['one',bypass.sessionId]);let finished=await rpc('mutate_execution',['one',bypass.sessionId,raw.execution.session.version,id(request++),JSON.stringify({kind:'finish'})],['text','uuid','integer','uuid','jsonb']);
await rejects('select public.mutate_execution($1,$2,$3,$4,$5::jsonb)',['one',bypass.sessionId,finished.data.session.version,id(request++),JSON.stringify({kind:'debrief',attemptId:finished.data.attempts[0].id,result:'solved_independently',confidence:5,mistakes:[]})],'22023');
check(true,'generic reflection cannot bypass the learning evaluator');
raw=await rpc('learning_session',['one',bypass.sessionId]);let real=await rpc('learning_submit',['one',bypass.sessionId,raw.execution.session.version,JSON.stringify(198),4,['logic']],['text','uuid','integer','jsonb','integer','text[]']);check((await db.query('select mistakes from question_attempts where item_id=$1',[real.binding.item_id])).rows[0].mistakes[0]==='logic','controlled self-reported mistake reaches shared attempt');
check((await rpc('mastery_evidence',['one',90])).groups.find(g=>g.entity_id==='learn-aptitude-percentages').reviews===0,'early correct repeat cannot manufacture retention');
await db.exec('reset role');

await db.query("update revision_items set due_at=now()-interval '1 day' where entity_id in(select item_id from learning_execution_bindings where activity_id=$1)",[activity]);await login(id(1));
let dueLaunch=await rpc('learning_launch',['one',activity,'practice',id(request++)]),dueSession=await rpc('learning_session',['one',dueLaunch.sessionId]);await rpc('learning_submit',['one',dueLaunch.sessionId,dueSession.execution.session.version,JSON.stringify(198),4],['text','uuid','integer','jsonb','integer']);
let dueEvidence=(await rpc('mastery_evidence',['one',90])).groups.find(g=>g.entity_id==='learn-aptitude-percentages');check(dueEvidence.reviews===1&&dueEvidence.retained===1,'due learning review contributes real spaced retention');check(dueEvidence.initial_attempts===1&&dueEvidence.distinct_entities===1,'due recall does not inflate novel coverage');check((await db.query("select interval_days from revision_items where entity_id in(select item_id from learning_execution_bindings where activity_id=$1)",[activity])).rows[0].interval_days===3,'due independent recall advances the shared interval ladder');await db.exec('reset role');
await rejects("update learning_concepts set status='draft' where id=$1",[cid],'22023');
await db.query("insert into learning_concepts select id,2,topic_id,name,sort_order,'draft',summary,mental_model,worked_example,misconception,interview_prompt,interview_answer,diagram,source_reference,source_type,author,reviewer,reviewed_at,language_version from learning_concepts where id=$1 and version=1",[cid]);
await login(id(1));check((await rpc('learning_concept',['one',cid])).concept.version===1,'new draft does not replace current published version');check((await rpc('learning_catalog',['one','aptitude','learn-aptitude-percentages'])).concepts.find(c=>c.id===cid).version===1,'catalog resolves published version before newer draft');
await db.exec('reset role');const p1='learn-aptitude-number-systems-core',p2='learn-aptitude-percentages-core';await db.query("insert into learning_concept_relations values($1,1,$2,1,'prerequisite')",[p1,p2]);await rejects("insert into learning_concept_relations values($1,1,$2,1,'prerequisite')",[p2,p1],'22023');
await db.query("insert into workspace_curriculum_overrides(workspace_id,entity_type,entity_id,override_type,value) values($1,'topic',$2,'inclusion',$3::jsonb)",[id(11),'learn-java-collections-framework',JSON.stringify({included:false})]);await login(id(1));await rejects('select public.learning_launch($1,$2,$3,$4)',['one','learn-java-collections-framework-check','practice',id(request++)],'22023');
await db.exec('reset role');await db.query("update workspaces set status='archived' where id=$1",[id(11)]);await login(id(1));check((await rpc('learning_catalog',['one'])).workspace.canEdit===false,'archived workspace remains readable');await rejects('select public.learning_launch($1,$2,$3,$4)',['one',activity,'practice',id(request++)],'42501');await db.exec('reset role');await db.query("update workspaces set status='active' where id=$1",[id(11)]);await login(id(1));
await login(id(3));check((await rpc('learning_overview',['one'])).attempts===0,'same-workspace users have isolated progress');await rejects('select public.learning_session($1,$2)',['one',sid],'42501');
await login(id(2));await rejects('select public.learning_catalog($1)',['one'],'42501');check(!(await db.query('select * from workspace_learning_state')).rows.length,'cross-workspace notes protected');
await login(null,'anon');await rejects('select public.learning_catalog($1)',['one'],'42501');await rejects('select * from learning_concepts',[],'42501');
await db.exec('reset role');await rejects("update learning_concepts set summary='Changed' where id=$1",[cid],'22023');
await rejects("update private.learning_answer_keys set answer='199' where activity_id=$1",[activity],'22023');
await login(id(1));const locker=await rpc('learning_catalog',['one','java',null,'','',true]);check(locker.concepts.length===1&&locker.concepts[0].id===cid,'Learning Locker retrieves owned bookmarks across subjects');await db.exec('reset role');
const plans={};for(const [name,sql] of Object.entries({track:"select topic_id from learning_topic_catalog where subject_id='aptitude' order by sort_order,topic_id",concept:"select id,version,summary from learning_concepts where id='learn-aptitude-percentages-core' and status='published' order by version desc limit 1",due:"select r.id from revision_items r join learning_execution_bindings b on b.item_id=r.entity_id where r.workspace_id='00000000-0000-4000-8000-000000000011' and r.user_id='00000000-0000-4000-8000-000000000001' and r.state in ('scheduled','snoozed') and r.due_at<=now() order by r.due_at limit 8",topic:"select id from learning_concepts where topic_id='learn-aptitude-percentages' and status='published' order by sort_order",search:"select id from learning_concepts where status='published' and to_tsvector('english',name||' '||summary)@@websearch_to_tsquery('english','percentage')",progress:"select activity_id,count(*) from learning_execution_bindings where workspace_id='00000000-0000-4000-8000-000000000011' and user_id='00000000-0000-4000-8000-000000000001' group by activity_id"})){plans[name]=(await db.query('explain (analyze,buffers,format json) '+sql)).rows[0]['QUERY PLAN'];check(plans[name][0]['Execution Time']>=0,name+' EXPLAIN');}
await fs.writeFile('docs/design/workspace/learning-query-plans.json',JSON.stringify({fixture:'Ephemeral small ownership fixture; not a scale benchmark',plans},null,2));
console.log('Learning PostgreSQL: '+checks+' checks passed');
}catch(error){console.error({message:error.message,code:error.code,detail:error.detail,where:error.where});process.exitCode=1}finally{await db.close()}
