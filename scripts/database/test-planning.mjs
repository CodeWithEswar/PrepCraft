import assert from "node:assert/strict"
import fs from "node:fs/promises"
import {PGlite} from "@electric-sql/pglite"
const db=new PGlite(),id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`
let checks=0
const check=(condition,label)=>{assert(condition,label);checks++}
const rejects=async(sql,args,code)=>{await assert.rejects(()=>db.query(sql,args),error=>{assert.equal(error.code,code,error.message);return true});checks++}
try{
await db.exec(`create role authenticated;create role anon;create role service_role;
create schema auth;create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema public,auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
create table workspaces(id uuid primary key,slug text,status text,timezone text);
create table workspace_members(workspace_id uuid,user_id uuid,status text,role text);
create table workspace_targets(workspace_id uuid,template_id text,updated_at timestamptz);
create table workspace_preferences(workspace_id uuid,updated_at timestamptz,study_days text[],default_daily_minutes integer);
create table workspace_curricula(id uuid,workspace_id uuid,updated_at timestamptz);
create table workspace_curriculum_overrides(id uuid,workspace_id uuid);
create table tracks(id text primary key);create table topics(id text primary key,track_id text references tracks);
create function public.is_workspace_member(p_workspace_id uuid) returns boolean language sql security definer stable set search_path='' as $$select exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=(select auth.uid()) and status='active')$$;
insert into auth.users values('${id(1)}'),('${id(2)}'),('${id(3)}');
insert into workspaces values('${id(11)}','one','active','UTC'),('${id(12)}','two','active','UTC');
insert into workspace_members values('${id(11)}','${id(1)}','active','owner'),('${id(12)}','${id(2)}','active','owner'),('${id(11)}','${id(3)}','disabled','member');
insert into workspace_targets values('${id(11)}','general',now()),('${id(12)}','general',now());
insert into workspace_preferences values('${id(11)}',now(),array['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],120),('${id(12)}',now(),array['monday'],60);
`)
const files=(await fs.readdir("supabase/migrations")).filter(file=>/_today_command_center.sql|_today_plan_review_safety.sql|_planning_capacity_goals_and_proposals.sql/.test(file)).sort()
for(const file of files)await db.exec(await fs.readFile(`supabase/migrations/${file}`,"utf8"))
check(true,"migrations execute")
const day=(await db.query("select current_date::text as day")).rows[0].day,week=(await db.query("select date_trunc('week',current_date)::date::text as week")).rows[0].week
const login=async(user,role="authenticated")=>{await db.exec("reset role");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||""]);await db.exec(`set role ${role}`)}
let request=100
const version=async()=>Number((await db.query("select revision from planning_state where workspace_id=$1",[id(11)])).rows[0]?.revision||0)
const context=(await db.query("select private.planning_context($1) ctx",[id(11)])).rows[0].ctx
const command=async(payload,{rev,req,slug="one",targetWeek=week}={})=>db.query("select public.mutate_planning($1,$2::date,$3,$4::uuid,$5,$6::jsonb) revision",[slug,targetWeek,rev??await version(),req||id(request++),context,JSON.stringify(payload)])
await login(id(1))
const firstReq=id(1000),first={kind:"add",day,title:"SQL concepts",notes:"",type:"fundamentals",minutes:30,required:true}
await command(first,{req:firstReq,rev:0});const firstVersion=await version()
await command(first,{req:firstReq,rev:0})
check(await version()===firstVersion,"retry is idempotent")
await rejects("select public.mutate_planning($1,$2::date,0,$3,$4,$5::jsonb)",["one",week,id(1001),context,JSON.stringify(first)],"40001")
await rejects("update daily_tasks set estimated_minutes=1",[],"42501")
await rejects("insert into weekly_goals(workspace_id,week_start) values($1,$2)",[id(11),week],"42501")
await command({kind:"goal",title:"Focused preparation",goalKind:"study_time",unit:"minutes",target:240})
check((await db.query("select count(*)::int n from weekly_goal_items")).rows[0].n===1,"generic goal saved")
await command({kind:"availability",rules:[],override:{day,minutes:45,rest:false,start:null,end:null}})
const before=await version()
await rejects("select public.mutate_planning($1,$2::date,$3,$4,$5,$6::jsonb)",["one",week,before,id(1002),context,JSON.stringify({...first,title:"Over capacity",minutes:30})],"22023")
check(await version()===before,"capacity rejection rolls back entire transaction")
check((await db.query("select count(*)::int n from daily_tasks")).rows[0].n===1,"capacity failure did not insert")
await rejects("select public.mutate_today($1,$2::date,$3::jsonb)",["one",day,JSON.stringify({kind:"add",taskId:id(40),title:"Bypass capacity",type:"dsa",minutes:60,required:true})],"22023")
await command({kind:"availability",rules:[],override:{day,minutes:120,rest:false,start:"09:00",end:"12:00"}})
await command({...first,title:"Window one",minutes:30,scheduledStart:`${day}T09:00:00Z`,scheduledEnd:`${day}T09:30:00Z`})
await rejects("select public.mutate_planning($1,$2::date,$3,$4,$5,$6::jsonb)",["one",week,await version(),id(1003),context,JSON.stringify({...first,title:"Overlap",scheduledStart:`${day}T09:15:00Z`,scheduledEnd:`${day}T09:45:00Z`})],"22023")
const taskIds=(await db.query("select id from daily_tasks order by created_at desc")).rows.map(row=>row.id)
await command({kind:"reorder",day,taskIds})
check((await db.query("select id from daily_tasks order by sort_order")).rows[0].id===taskIds[0],"keyboard reorder persists")
await rejects("select public.mutate_planning($1,$2::date,$3,$4,$5,$6::jsonb)",["one",week,await version(),id(1010),context,JSON.stringify({kind:"apply",policy:"capacity-v1",items:[{existingId:taskIds[0],day}]})],"40001")
await rejects("select public.mutate_planning($1,$2::date,$3,$4,$5,$6::jsonb)",["one",week,await version(),id(1011),context,JSON.stringify({kind:"apply",policy:"invalid",items:[]})],"22023")
await db.exec("reset role")
check((await db.query("select private.planning_capacity($1,'2026-10-20'::date) c",[id(12)])).rows[0].c===0,"non-study day has 0 capacity without active plan")
await db.query("insert into daily_plans(workspace_id,plan_date,timezone,context_version,status) values($1,'2026-10-20','UTC','ctx','active')",[id(12)])
check((await db.query("select private.planning_capacity($1,'2026-10-20'::date) c",[id(12)])).rows[0].c===60,"active plan enables capacity on non-study day")
await login(id(1))
await login(id(2))
check((await db.query("select count(*)::int n from daily_tasks")).rows[0].n===0,"cross-workspace tasks invisible")
check((await db.query("select count(*)::int n from weekly_goal_items")).rows[0].n===0,"cross-workspace goals invisible")
await rejects("select public.mutate_planning($1,$2::date,0,$3,$4,$5::jsonb)",["one",week,id(1004),context,JSON.stringify(first)],"42501")
await login(id(3))
check((await db.query("select count(*)::int n from planning_availability_overrides")).rows[0].n===0,"disabled member cannot read availability")
await login(null,"anon")
await rejects("select * from weekly_reviews",[],"42501")
await db.exec("reset role")
const priorDay=(await db.query("select (current_date-8)::text as day")).rows[0].day,priorWeek=(await db.query("select date_trunc('week',current_date-8)::date::text as week")).rows[0].week
await db.query("insert into daily_plans(workspace_id,plan_date,timezone,context_version) values($1,$2,'UTC',$3)",[id(11),priorDay,context])
const priorPlan=(await db.query("select id from daily_plans where plan_date=$1",[priorDay])).rows[0].id
await db.query("insert into daily_tasks(id,daily_plan_id,workspace_id,source_type,task_type,title,estimated_minutes,required) values($1,$2,$3,'custom','dsa','Earlier arrays',30,true)",[id(30),priorPlan,id(11)])
await login(id(1))
await rejects("select public.mutate_planning($1,$2::date,$3,$4,$5,$6::jsonb)",["one",priorWeek,await version(),id(1005),context,JSON.stringify({kind:"close",notes:"Review"})],"22023")
await command({kind:"carry",taskId:id(30),version:0,day})
const carried=(await db.query("select * from daily_tasks where carryover_from_task_id=$1",[id(30)])).rows[0]
check(carried.carryover_count===1&&carried.estimated_minutes===30,"carryover preserves lineage and estimate")
check((await db.query("select status from daily_tasks where id=$1",[id(30)])).rows[0].status==="deferred","carryover never completes original work")
await command({kind:"close",notes:"Explicit carryover reviewed."},{targetWeek:priorWeek})
check((await db.query("select summary from weekly_reviews")).rows[0].summary.focusedMinutes===null,"closed review never fakes focus")
await rejects("select public.mutate_planning($1,$2::date,$3,$4,$5,$6::jsonb)",["one",priorWeek,await version(),id(1006),context,JSON.stringify({kind:"goal",title:"Late edit",goalKind:"custom",unit:"count",target:1})],"22023")
await rejects("update weekly_reviews set notes='tamper'",[],"42501")
await db.exec("reset role")
await rejects("update daily_tasks set title='Closed history rewrite' where id=$1",[id(30)],"22023")
await login(id(1))
await db.exec("reset role");await db.query("update workspaces set status='archived' where id=$1",[id(11)]);await login(id(1))
await rejects("select public.mutate_planning($1,$2::date,$3,$4,$5,$6::jsonb)",["one",week,await version(),id(1007),context,JSON.stringify(first)],"42501")
console.log(`Planning PostgreSQL checks passed: ${checks}.`)
}finally{await db.close()}

