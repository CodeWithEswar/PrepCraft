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
check(true,"execution migration executes")
const login=async(user,role="authenticated")=>{await db.exec("reset role");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||""]);await db.exec(`set role ${role}`)}
const prompt={title:"Explain an array traversal",body:"Describe a single pass and its complexity.",topic:"Arrays",difficulty:"easy",constraints:"",examples:[],hints:[{title:"Direction",body:"Think about visiting each element once."},{title:"Pattern",body:"Keep one running accumulator."},{title:"Guidance",body:"Initialize the accumulator before the loop."}]}
const launch=async(mode="practice",prompts=[prompt],req=id(request++))=>(await db.query("select public.create_execution($1,$2,$3::jsonb) result",["one",req,JSON.stringify({mode,targetSeconds:60,source:"manual",prompts})])).rows[0].result
const resolve=async(session,slug="one")=>(await db.query("select public.resolve_execution($1,$2) result",[slug,session])).rows[0].result
const command=async(s,payload,{version,req}={})=>(await db.query("select public.mutate_execution($1,$2,$3,$4,$5::jsonb) result",["one",s.session.id,version??s.session.version,req||id(request++),JSON.stringify(payload)])).rows[0].result
await login(id(1))
const evidence=async(slug='one',days=90)=>(await db.query('select public.mastery_evidence($1,$2) result',[slug,days])).rows[0].result
check((await evidence()).totals.attempts===0,'empty evidence is empty, not invented zero scores')
let s=(await launch('practice',[{...prompt,topicId:'arrays'}])).data;s=(await command(s,{kind:'finish'})).data
await db.exec('reset role');await db.query("update question_attempts set duration_ms=60000,reflection_status='completed',result='solved_independently',confidence=4,completed_at=now(),pattern_id='sliding' where id=$1",[s.attempts[0].id]);await login(id(1))
let e=await evidence();check(e.groups.length===2&&e.totals.attempts===1,'topic and pattern aggregates share one real source without doubling workspace totals');check(e.groups.find(g=>g.entity_type==='topic').distinct_entities===1,'explicit learning identity preserved');check(e.groups[0].timing.count===0,'Practice is not timed-pressure evidence');check(!JSON.stringify(e).includes(prompt.body),'aggregate excludes question bodies')
await rejects('select public.assign_execution_topic($1,$2,$3)',['one',s.items[0].id,'trees'],'22023')
await rejects('update execution_topic_attributions set topic_id=$1',['trees'],'42501')
await rejects('select public.mastery_evidence($1,$2)',['one',9999],'22023')
await login(id(3));check((await evidence()).totals.attempts===0,'same-workspace member cannot mix private mastery evidence');await rejects('select public.assign_execution_topic($1,$2,$3)',['one',s.items[0].id,'arrays'],'42501')
await login(id(2));await rejects('select public.mastery_evidence($1)',['one'],'42501')
await login(id(1));let unmapped=(await launch()).data;unmapped=(await command(unmapped,{kind:'finish'})).data
await db.exec('reset role');await db.query("update question_attempts set duration_ms=60000,reflection_status='completed',result='could_not_solve',confidence=5,completed_at=now() where id=$1",[unmapped.attempts[0].id]);await login(id(1));check((await evidence()).unmapped.count===1,'free-text labels are not guessed into curriculum topics')
await db.query('select public.assign_execution_topic($1,$2,$3)',['one',unmapped.items[0].id,'arrays']);await db.query('select public.assign_execution_topic($1,$2,$3)',['one',unmapped.items[0].id,'arrays']);check((await evidence()).unmapped.count===0,'explicit topic assignment is idempotent')
let interview=(await launch('interview',[{...prompt,topicId:'arrays'}])).data;interview=(await command(interview,{kind:'finish'})).data
await db.exec('reset role');await db.query("update question_attempts set duration_ms=60000,target_duration_ms=60000,reflection_status='completed',result='solved_independently',confidence=4,completed_at=now() where id=$1",[interview.attempts[0].id]);await login(id(1));e=await evidence();check(e.groups.find(g=>g.entity_type==='topic').timing.medianRatio===1,'Interview target ratio aggregated without a global baseline')
await db.exec('reset role');await db.query('update question_attempts set duration_ms=300000 where id=$1',[interview.attempts[0].id]);await login(id(1));e=await evidence();check(e.groups.find(g=>g.entity_type==='topic').timing.count===0&&e.groups.find(g=>g.entity_type==='topic').timing.outliers===1,'timing outliers are counted and excluded, not silently removed')
let short=(await launch('practice',[{...prompt,topicId:'arrays'}])).data;short=(await command(short,{kind:'finish'})).data
await db.exec('reset role');await db.query("update question_attempts set duration_ms=1000,reflection_status='completed',result='solved_independently',confidence=5,completed_at=now() where id=$1",[short.attempts[0].id]);await login(id(1));check((await evidence()).totals.attempts===3,'very short attempts are not meaningful mastery evidence')
const spine=(await db.query('select public.mastery_spine($1,$2,$3) result',['one','topic','arrays'])).rows[0].result;check(spine.length===3,'lazy spine contains source evidence only');check(!JSON.stringify(spine).includes('notes'),'spine omits private reflections')
await db.exec('reset role');let revisionId=(await db.query('select private.consume_revision_attempt($1) id',[s.attempts[0].id])).rows[0].id;
for(let n=0;n<2;n++){
 await db.query("update revision_items set due_at=now()-interval '1 day' where id=$1",[revisionId]);const version=(await db.query('select version from revision_items where id=$1',[revisionId])).rows[0].version;await login(id(1));const started=(await db.query('select public.mutate_revision($1,$2,$3,$4,$5::jsonb) result',['one',revisionId,version,id(request++),JSON.stringify({kind:'start'})])).rows[0].result;let reviewSession=await resolve(started.sessionId);reviewSession=(await command(reviewSession,{kind:'finish'})).data;await db.exec('reset role');await db.query("update question_attempts set duration_ms=60000,reflection_status='completed',result='solved_independently',confidence=4,completed_at=now(),pattern_id='sliding' where id=$1",[reviewSession.attempts[0].id]);await db.query('select private.consume_revision_attempt($1)',[reviewSession.attempts[0].id]);
}
await login(id(1));e=await evidence();const topic=e.groups.find(g=>g.entity_type==='topic');check(topic.reviews===2&&topic.retained===2,'retention uses actual reviews, excluding initial scheduling');check(topic.initial_attempts===3&&topic.distinct_entities===3,'repeated revision cannot inflate initial solving or distinct question coverage');check((await evidence('one',7)).totals.attempts===5,'bounded 7-day evidence window');
const past=(await db.query("select public.mastery_evidence($1,90,now()-interval '14 days') result",['one'])).rows[0].result;check(past.totals.attempts===0,'historical windows exclude later evidence');
for(let batch=0;batch<4;batch++){let round=(await launch('oa',Array.from({length:8},(_,n)=>({...prompt,title:'Cursor fixture '+batch+' '+n,topicId:'arrays'})))).data;round=(await command(round,{kind:'finish'})).data;await db.exec('reset role');await db.query("update question_attempts set duration_ms=60000,reflection_status='completed',result='solved_independently',confidence=4,completed_at=now()-interval '1 hour' where session_id=$1",[round.session.id]);await login(id(1));}
const page1=(await db.query('select public.mastery_spine($1,$2,$3) result',['one','topic','arrays'])).rows[0].result;check(page1.length===31,'history bounded with one lookahead');const last=page1[29];const page2=(await db.query('select public.mastery_spine($1,$2,$3,$4::jsonb) result',['one','topic','arrays',JSON.stringify({at:last.completed_at,id:last.id})])).rows[0].result;check(page2.length>0&&!page2.some(row=>page1.slice(0,30).some(prior=>prior.id===row.id)),'timestamp and UUID keyset retains tied-time evidence without duplicates');
await login(null,'anon');await rejects('select public.mastery_evidence($1)',['one'],'42501')
await db.exec('reset role');const plan=(await db.query("explain (analyze,buffers,format json) select id from question_attempts where workspace_id=$1 and user_id=$2 and reflection_status='completed' and duration_ms>=30000 and completed_at>=now()-interval '90 days'",[id(11),id(1)])).rows[0]['QUERY PLAN'];await fs.writeFile('docs/design/workspace/mastery-query-plan.json',JSON.stringify({fixture:'Ephemeral ownership fixture, not a scale benchmark',plan},null,2));check(plan[0]['Execution Time']>=0,'bounded evidence query EXPLAIN ANALYZE')
console.log('Mastery PostgreSQL: '+checks+' checks passed')
}catch(error){console.error({message:error.message,code:error.code});process.exitCode=1}finally{await db.close()}
