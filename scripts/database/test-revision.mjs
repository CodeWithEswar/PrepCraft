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
const files=(await fs.readdir("supabase/migrations")).filter(file=>/_today_command_center.sql|_today_plan_review_safety.sql|_planning_capacity_goals_and_proposals.sql|_fix_active_planning_capacity.sql|_execution_engine_sessions.sql|_revision_retention_engine.sql|_execution_contract_hardening.sql|_revision_authorization_locking.sql/.test(file)).sort()
for(const file of files){const sql=await fs.readFile(`supabase/migrations/${file}`,"utf8");try{await db.exec(sql)}catch(error){console.error({migration:file,position:error.position,near:sql.slice(Math.max(0,Number(error.position)-120),Number(error.position)+120)});throw error}}
check(true,"execution migration executes")
const login=async(user,role="authenticated")=>{await db.exec("reset role");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||""]);await db.exec(`set role ${role}`)}
const prompt={title:"Explain an array traversal",body:"Describe a single pass and its complexity.",topic:"Arrays",difficulty:"easy",constraints:"",examples:[],hints:[{title:"Direction",body:"Think about visiting each element once."},{title:"Pattern",body:"Keep one running accumulator."},{title:"Guidance",body:"Initialize the accumulator before the loop."}]}
const launch=async(mode="practice",prompts=[prompt],req=id(request++))=>(await db.query("select public.create_execution($1,$2,$3::jsonb) result",["one",req,JSON.stringify({mode,targetSeconds:60,source:"manual",prompts})])).rows[0].result
const resolve=async(session,slug="one")=>(await db.query("select public.resolve_execution($1,$2) result",[slug,session])).rows[0].result
const command=async(s,payload,{version,req}={})=>(await db.query("select public.mutate_execution($1,$2,$3,$4,$5::jsonb) result",["one",s.session.id,version??s.session.version,req||id(request++),JSON.stringify(payload)])).rows[0].result
await login(id(1))
let s=(await launch()).data
s=(await command(s,{kind:'finish'})).data
const review={kind:'debrief',attemptId:s.attempts[0].id,result:'solved_independently',confidence:4,approach:'',patternId:null,timeComplexity:'',spaceComplexity:'',mistakes:[],notes:''}
s=(await command(s,review)).data
const queue=async(filters={},cursor=null)=>(await db.query('select public.revision_queue($1,$2::jsonb,$3::jsonb) result',['one',JSON.stringify(filters),cursor?JSON.stringify(cursor):null])).rows[0].result
let q=await queue();check(q.items.length===1,'committed debrief creates one revision');let item=q.items[0]
check(item.interval_days===1&&item.review_count===0,'initial interval is one day, not a completed review')
check((await db.query('select count(*)::int n from revision_attempts')).rows[0].n===1,'immutable initial scheduling evidence')
check((await db.query('select public.reconcile_revision($1) n',['one'])).rows[0].n===0,'reconciliation is idempotent')
const mutate=async(r,cmd,req=id(request++))=>(await db.query('select public.mutate_revision($1,$2,$3,$4,$5::jsonb) result',['one',r.id,r.version,req,JSON.stringify(cmd)])).rows[0].result
await rejects('update revision_items set interval_days=30',[],'42501')
await rejects('select public.mutate_revision($1,$2,$3,$4,$5::jsonb)',['one',item.id,item.version,id(request++),JSON.stringify({kind:'start'})],'22023')
await db.exec('reset role');await db.query("update revision_items set due_at=now()-interval '2 days' where id=$1",[item.id]);await login(id(1));q=await queue();item=q.items[0]
check(q.summary.due===1&&q.summary.overdue===1,'due and overdue derived in workspace zone')
let start=await mutate(item,{kind:'start'});check(Boolean(start.sessionId),'revision launches existing Execution')
s=await resolve(start.sessionId);check(s.session.task_type==='revision','focus categorized as revision')
check(s.items[0].body===prompt.body&&s.items[0].code==='','revision resolves owned prompt content without revealing prior answer')
let current=(await queue()).items[0];check((await mutate(current,{kind:'start'})).sessionId===s.session.id,'double start resumes same session')
await rejects('select public.mutate_revision($1,$2,$3,$4,$5::jsonb)',['one',current.id,current.version,id(request++),JSON.stringify({kind:'snooze',until:new Date(Date.now()+86400000).toISOString(),reason:''})],'40001')
s=(await command(s,{kind:'finish'})).data;s=(await command(s,{...review,attemptId:s.attempts[0].id})).data
q=await queue();item=q.items[0];check(q.items.length===1&&item.interval_days===3&&item.review_count===1,'review updates same identity and advances interval')
check((await db.query('select count(*)::int n from revision_attempts')).rows[0].n===2,'two immutable evidence rows')
const until=new Date(Date.parse(item.due_at)+86400000).toISOString(),rid=id(request++),sn=await mutate(item,{kind:'snooze',until,reason:'Busy day'},rid)
check(Boolean(sn.snoozeId),'snooze has its own record');check((await mutate(item,{kind:'snooze',until,reason:'Busy day'},rid)).snoozeId===sn.snoozeId,'snooze retry idempotent')
let snoozed=(await queue()).items[0];check(snoozed.interval_days===3&&snoozed.review_count===1&&snoozed.state==='snoozed','snooze does not count as recall')
await mutate(snoozed,{kind:'undo_snooze',snoozeId:sn.snoozeId});current=(await queue()).items[0];check(current.due_at===item.due_at&&current.snooze_count===0,'undo restores exact previous date')
await rejects('select public.mutate_revision($1,$2,$3,$4,$5::jsonb)',['one',item.id,0,id(request++),JSON.stringify({kind:'retire'})],'40001')
await mutate(current,{kind:'retire'});check((await queue()).items.length===0,'retired items leave active queue');let retired=(await queue({state:'retired'})).items[0];await mutate(retired,{kind:'restore'});check((await queue()).items.length===1,'restored relationship preserves identity')
const detail=(await db.query('select public.revision_detail($1,$2) result',['one',item.id])).rows[0].result;check(detail.history.length===2&&detail.evidence.independent===2,'history and real evidence aggregates')
await login(id(3));check((await db.query('select count(*)::int n from revision_items')).rows[0].n===0,'same-workspace member cannot read private learning evidence');await rejects('select public.revision_detail($1,$2)',['one',item.id],'42501')
await login(id(2));await rejects('select public.mutate_revision($1,$2,$3,$4,$5::jsonb)',['one',item.id,0,id(request++),JSON.stringify({kind:'retire'})],'42501')
await login(null,'anon');await rejects('select public.revision_queue($1)',['one'],'42501')
await db.exec('reset role');const outcomes=['independent_success','minor_assistance','major_assistance','failed_recall'];for(const previous of [null,1,3,7,14,30])for(const outcome of outcomes){const value=(await db.query('select private.revision_interval($1,$2) n',[previous,outcome])).rows[0].n;const ladder=[1,3,7,14,30],ix=ladder.indexOf(previous);const expected=previous===null?1:outcome==='independent_success'?ladder[Math.min(4,ix+1)]:outcome==='minor_assistance'?previous:outcome==='major_assistance'?ladder[Math.max(0,ix-1)]:1;check(value===expected,'policy transition parity')}
const explain=(await db.query("explain (analyze,buffers,format json) select id,due_at from revision_items where workspace_id=$1 and user_id=$2 and state in ('scheduled','snoozed') and due_at<=now() order by due_at,id limit 40",[id(11),id(1)])).rows[0]['QUERY PLAN'];await fs.writeFile('docs/design/workspace/revision-query-plan.json',JSON.stringify({fixture:'Ephemeral PostgreSQL authorization fixture; not a scale benchmark',plan:explain},null,2)+'\n');check(explain[0]['Execution Time']>=0,'critical due query EXPLAIN ANALYZE executes');
for(const [zone,at,expected] of [['America/New_York','2026-03-07T18:00:00Z','2026-03-08T13:00:00Z'],['Europe/London','2026-10-24T18:00:00Z','2026-10-25T09:00:00Z'],['Asia/Calcutta','2026-10-24T19:00:00Z','2026-10-26T03:30:00Z']]){
await db.exec('reset role');await db.query('update workspaces set timezone=$1 where id=$2',[zone,id(11)]);await login(id(1));let sample=(await launch()).data;sample=(await command(sample,{kind:'finish'})).data;
await db.exec('reset role');const aid=sample.attempts[0].id;await db.query("update question_attempts set reflection_status='completed',result='solved_independently',confidence=4,completed_at=$1 where id=$2",[at,aid]);const created=(await db.query('select private.consume_revision_attempt($1) id',[aid])).rows[0].id;const due=(await db.query('select due_at from revision_items where id=$1',[created])).rows[0].due_at;check(Date.parse(due)===Date.parse(expected),'calendar scheduling respects '+zone+' DST/date boundary');check((await db.query('select private.consume_revision_attempt($1) id',[aid])).rows[0].id===created,'duplicate consumer receipt is idempotent');}
await db.query("update workspaces set status='archived' where id=$1",[id(11)]);await login(id(1));await rejects('select public.mutate_revision($1,$2,$3,$4,$5::jsonb)',['one',item.id,0,id(request++),JSON.stringify({kind:'retire'})],'42501');
await db.exec('reset role');await db.query("update workspaces set status='active' where id=$1",[id(11)]);await db.query("update workspace_members set status='disabled' where workspace_id=$1 and user_id=$2",[id(11),id(1)]);await login(id(1));await rejects('select public.revision_queue($1)',['one'],'42501');
console.log('Revision PostgreSQL: '+checks+' checks passed')
} catch(error){console.error({message:error.message,code:error.code});process.exitCode=1}finally{await db.close()}
