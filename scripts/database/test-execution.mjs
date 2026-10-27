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
const files=(await fs.readdir("supabase/migrations")).filter(file=>/_today_command_center.sql|_today_plan_review_safety.sql|_planning_capacity_goals_and_proposals.sql|_fix_active_planning_capacity.sql|_execution_engine_sessions.sql/.test(file)).sort()
for(const file of files)await db.exec(await fs.readFile(`supabase/migrations/${file}`,"utf8"))
check(true,"execution migration executes")
const login=async(user,role="authenticated")=>{await db.exec("reset role");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||""]);await db.exec(`set role ${role}`)}
const prompt={title:"Explain an array traversal",body:"Describe a single pass and its complexity.",topic:"Arrays",difficulty:"easy",constraints:"",examples:[],hints:[{title:"Direction",body:"Think about visiting each element once."},{title:"Pattern",body:"Keep one running accumulator."},{title:"Guidance",body:"Initialize the accumulator before the loop."}]}
const launch=async(mode="practice",prompts=[prompt],req=id(request++))=>(await db.query("select public.create_execution($1,$2,$3::jsonb) result",["one",req,JSON.stringify({mode,targetSeconds:60,source:"manual",prompts})])).rows[0].result
const resolve=async(session,slug="one")=>(await db.query("select public.resolve_execution($1,$2) result",[slug,session])).rows[0].result
const command=async(s,payload,{version,req}={})=>(await db.query("select public.mutate_execution($1,$2,$3,$4,$5::jsonb) result",["one",s.session.id,version??s.session.version,req||id(request++),JSON.stringify(payload)])).rows[0].result
await login(id(1))
const launchId=id(1000),first=await launch("practice",[prompt],launchId);let s=first.data
check(first.ok&&s.session.status==="active","explicit launch starts authoritative timing")
check((await launch("practice",[prompt],launchId)).data.session.id===s.session.id,"launch retry is idempotent")
check(!(await launch()).ok,"another active session is rejected")
check(s.items[0].hints.length===0,"unrevealed hint bodies are not returned")
check((await db.query("select count(*)::int n from execution_item_hints")).rows[0].n===0,"direct hint reads cannot bypass reveal")
await rejects("update execution_sessions set accumulated_pause_ms=999",[],"42501")
await rejects("insert into question_attempts(id) values($1)",[id(90)],"42501")
let r=await command(s,{kind:"pause"});s=r.data
check(s.session.status==="paused"&&s.session.paused_at!==null,"Practice pause is persisted")
const paused=await resolve(s.session.id);check(paused.session.paused_at===s.session.paused_at,"refresh preserves pause")
r=await command(s,{kind:"resume"});s=r.data
check(s.session.status==="active"&&s.session.paused_at===null,"resume clears the pause and reopens active time")
await rejects("select public.mutate_execution($1,$2,0,$3,$4::jsonb)",["one",s.session.id,id(1001),JSON.stringify({kind:"finish"})],"40001")
r=await command(s,{kind:"hint",itemId:s.items[0].id,level:1});s=r.data
check(s.items[0].hints.length===1,"hint reveal records and returns real evidence")
const finishId=id(1002),finished=await command(s,{kind:"finish"},{req:finishId});s=finished.data
check(s.session.status==="completed"&&s.attempts[0].reflection_status==="pending","timing finishes before reflection")
const duration=s.attempts[0].duration_ms
check((await command(s,{kind:"finish"},{req:finishId})).data.session.completed_at===s.session.completed_at,"finish retry does not move the end time")
const debrief={kind:"debrief",attemptId:s.attempts[0].id,result:"solved_independently",confidence:4,approach:"One pass",patternId:null,timeComplexity:"O(n)",spaceComplexity:"O(1)",mistakes:["edge_case"],notes:"Check empty input."}
await rejects("select public.mutate_execution($1,$2,$3,$4,$5::jsonb)",["one",s.session.id,s.session.version,id(1003),JSON.stringify(debrief)],"22023")
r=await command(s,{...debrief,result:"solved_small_hint"},{req:id(1004)});s=r.data
check(s.attempts[0].duration_ms===duration,"reflection cannot inflate solve duration")
check(s.attempts[0].reflection_status==="completed","debrief commits separately")
check((await db.query("select count(*)::int n from attempt_outbox_events")).rows[0].n===1,"attempt and outbox event commit together")
await command(s,{...debrief,result:"solved_small_hint"},{req:id(1004)})
check((await db.query("select count(*)::int n from attempt_outbox_events")).rows[0].n===1,"duplicate debrief does not duplicate downstream evidence")
check(!(JSON.stringify((await db.query("select payload from attempt_outbox_events")).rows[0].payload).includes("Check empty input")),"outbox excludes private reflection text")
await login(id(3))
check((await db.query("select count(*)::int n from execution_sessions")).rows[0].n===0,"another member cannot read a user's private execution state")
await rejects("select public.resolve_execution($1,$2)",["one",s.session.id],"42501")
await login(id(2));await rejects("select public.resolve_execution($1,$2)",["one",s.session.id],"42501")
await login(id(1));let interview=(await launch("interview")).data
await rejects("select public.mutate_execution($1,$2,$3,$4,$5::jsonb)",["one",interview.session.id,interview.session.version,id(1005),JSON.stringify({kind:"pause"})],"22023")
interview=(await command(interview,{kind:"phase",phase:"approach"})).data
check(interview.session.phase==="approach","Interview phase is real persisted guidance")
for(const level of [1,2])interview=(await command(interview,{kind:"hint",itemId:interview.items[0].id,level})).data
await rejects("select public.mutate_execution($1,$2,$3,$4,$5::jsonb)",["one",interview.session.id,interview.session.version,id(1006),JSON.stringify({kind:"hint",itemId:interview.items[0].id,level:3})],"22023")
await command(interview,{kind:"finish"})
let oa=(await launch("oa",[prompt,{...prompt,title:"Explain a nested traversal"}])).data
await rejects("select public.mutate_execution($1,$2,$3,$4,$5::jsonb)",["one",oa.session.id,oa.session.version,id(1007),JSON.stringify({kind:"pause"})],"22023")
await rejects("select public.mutate_execution($1,$2,$3,$4,$5::jsonb)",["one",oa.session.id,oa.session.version,id(1008),JSON.stringify({kind:"hint",itemId:oa.items[0].id,level:1})],"22023")
const expiry=oa.session.expires_at
oa=(await command(oa,{kind:"navigate",itemId:oa.items[1].id})).data
check(oa.session.expires_at===expiry,"question switching cannot reset the OA round")
oa=(await command(oa,{kind:"answer",itemId:oa.items[1].id,answered:true})).data
check(oa.items[1].status==="answered","answered is a submission state without claiming correctness")
await db.exec("reset role")
await db.query("update execution_sessions set started_at=now()-interval '120 seconds',expires_at=now()-interval '60 seconds' where id=$1",[oa.session.id])
await db.query("update execution_focus_intervals set started_at=now()-interval '120 seconds',ended_at=case when ended_at is null then null else now()-interval '90 seconds' end where session_id=$1",[oa.session.id])
await login(id(1))
const lateReq=id(1009);r=await command(oa,{kind:"flag",itemId:oa.items[1].id,flagged:true},{req:lateReq})
check(!r.ok&&r.code==="expired"&&r.data.session.status==="expired","late write rejects while committing authoritative expiry")
check(r.data.items[1].flagged===false,"late answer state was not applied")
check(!(await command(oa,{kind:"flag",itemId:oa.items[1].id,flagged:true},{req:lateReq})).ok,"late retry cannot become a false successful save")
const expired=await resolve(oa.session.id)
check(expired.session.status==="expired"&&expired.attempts.length===2,"refresh after sleep resolves the expired round and pending evidence")
check((await db.query("select count(*)::int n from execution_focus_intervals where ended_at is null")).rows[0].n===0,"terminal session has no running focus interval")
await login(null,"anon");await rejects("select * from execution_sessions",[],"42501")
await db.exec("reset role");await db.query("update workspace_members set status='disabled' where workspace_id=$1 and user_id=$2",[id(11),id(1)]);await login(id(1))
await rejects("select public.resolve_execution($1,$2)",["one",s.session.id],"42501")
console.log(`Execution PostgreSQL checks passed: ${checks}.`)
}catch(error){console.error(JSON.stringify({message:error.message,code:error.code,where:error.where,query:error.query?.slice(0,1600)}));process.exitCode=1}finally{await db.close()}
