import assert from "node:assert/strict"
import fs from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"

// Actual PostgreSQL execution in isolation. Fixtures mirror existing upstream contracts;
// this does not substitute for applying the entire Supabase migration chain in CI.
const db=new PGlite()
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`
let checks=0
const check=(value,message)=>{assert(value,message);checks++}
const reject=async(sql,params,code)=>{await assert.rejects(()=>db.query(sql,params),error=>{assert.equal(error.code,code);return true});checks++}
try {
  await db.exec(`
    create role authenticated;create role anon;create role service_role;
    create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
    create table public.workspaces(id uuid primary key,slug text unique,status text,timezone text);
    create table public.workspace_members(workspace_id uuid,user_id uuid,status text,role text);
    create table public.workspace_targets(workspace_id uuid,template_id text,updated_at timestamptz);
    create table public.workspace_preferences(workspace_id uuid,updated_at timestamptz);
    create table public.workspace_curricula(id uuid,workspace_id uuid,updated_at timestamptz);
    create function public.is_workspace_member(p_workspace_id uuid) returns boolean language sql security definer stable set search_path='' as $$select exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=(select auth.uid()) and status='active')$$;
    insert into auth.users values('${id(1)}'),('${id(2)}'),('${id(3)}');
    insert into workspaces values('${id(11)}','one','active','Asia/Kolkata'),('${id(12)}','two','active','America/New_York');
    insert into workspace_members values('${id(11)}','${id(1)}','active','owner'),('${id(12)}','${id(2)}','active','owner'),('${id(11)}','${id(3)}','disabled','member');
    insert into workspace_targets values('${id(11)}','general',now()),('${id(12)}','general',now());
  `)
  const files=await fs.readdir("supabase/migrations")
  const migration=files.find(file=>file.endsWith("_today_command_center.sql"))
  assert(migration)
  await db.exec(await fs.readFile(`supabase/migrations/${migration}`,"utf8"))
  for(const followup of files.filter(file=>file.endsWith("_today_plan_review_safety.sql")).sort())await db.exec(await fs.readFile(`supabase/migrations/${followup}`,"utf8"))
  check(true,"migration executes")
  const day=(await db.query("select (now() at time zone 'Asia/Kolkata')::date::text as day")).rows[0].day
  const login=async(user,role="authenticated")=>{await db.exec("reset role");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||""]);await db.exec(`set role ${role}`)}
  const command=async(slug,payload)=>db.query("select public.mutate_today($1,$2::date,$3::jsonb) as id",[slug,day,JSON.stringify(payload)])
  await login(id(1))
  await command("one",{kind:"review"})
  await command("one",{kind:"add",taskId:id(21),title:"Review SQL joins",type:"fundamentals",minutes:30,required:true})
  await command("one",{kind:"add",taskId:id(22),title:"Read optional notes",type:"custom",minutes:15,required:false})
  check((await db.query("select count(*)::int as n from daily_tasks")).rows[0].n===2,"member can read tasks")
  await db.exec("reset role")
  await db.exec("update daily_plans set timezone='UTC',context_version='old'")
  await login(id(1))
  await command("one",{kind:"review"})
  check((await db.query("select timezone from daily_plans where plan_date=$1",[day])).rows[0].timezone==="Asia/Kolkata","explicit review accepts a changed timezone")
  check((await db.query("select count(*)::int as n from daily_tasks")).rows[0].n===2,"review preserves tasks")
  await reject("insert into daily_tasks(id) values($1)",[id(99)],"42501")
  await reject("update daily_tasks set status='completed' where id=$1",[id(21)],"42501")
  await reject("select public.mutate_today($1,$2::date,$3::jsonb)",["two",day,JSON.stringify({kind:"create_plan"})],"42501")
  await command("one",{kind:"start",taskId:id(21),version:0})
  await command("one",{kind:"start",taskId:id(21),version:0})
  check((await db.query("select count(*)::int as n from today_activity_events where event_type='daily_task.started'")).rows[0].n===1,"starting is idempotent")
  await reject("select public.mutate_today($1,$2::date,$3::jsonb)",["one",day,JSON.stringify({kind:"complete",taskId:id(21),version:0})],"40001")
  await command("one",{kind:"complete",taskId:id(21),version:1})
  await command("one",{kind:"complete",taskId:id(21),version:1})
  check((await db.query("select count(*)::int as n from today_activity_events where event_type='daily_task.completed'")).rows[0].n===1,"completion is idempotent")
  check((await db.query("select count(*)::int as n from today_activity_events where event_type='daily_plan.completed'")).rows[0].n===1,"optional task does not block completion")
  check((await db.query("select planned_minutes from daily_plans")).rows[0].planned_minutes===45,"completion preserves historical estimates")
  await command("one",{kind:"defer",taskId:id(22),version:0,destination:(await db.query("select ($1::date+1)::text as day",[day])).rows[0].day})
  check((await db.query("select count(*)::int as n from daily_tasks")).rows[0].n===3,"deferral creates a separate future projection")
  await command("one",{kind:"rest"})
  check((await db.query("select status from daily_plans where plan_date=$1",[day])).rows[0].status==="rest","rest day is explicit")
  await reject("select public.mutate_today($1,$2::date,$3::jsonb)",["one","2000-01-01",JSON.stringify({kind:"create_plan"})],"40001")
  await login(id(2))
  check((await db.query("select count(*)::int as n from daily_tasks")).rows[0].n===0,"workspace B cannot see A tasks")
  await reject("select public.mutate_today($1,$2::date,$3::jsonb)",["one",day,JSON.stringify({kind:"complete",taskId:id(21),version:2})],"42501")
  await login(id(3))
  check((await db.query("select count(*)::int as n from daily_plans")).rows[0].n===0,"disabled member cannot read")
  await reject("select public.mutate_today($1,$2::date,$3::jsonb)",["one",day,JSON.stringify({kind:"create_plan"})],"42501")
  await login(null,"anon")
  await reject("select * from daily_tasks",[],"42501")
  await reject("select public.mutate_today($1,$2::date,$3::jsonb)",["one",day,JSON.stringify({kind:"create_plan"})],"42501")
  await db.exec("reset role")
  await reject("insert into daily_tasks(daily_plan_id,workspace_id,source_type,task_type,title,estimated_minutes) select id,$1,'custom','custom','Mismatch',30 from daily_plans limit 1",[id(12)],"23503")
  await reject("insert into daily_tasks(daily_plan_id,workspace_id,source_type,task_type,title,estimated_minutes) select id,workspace_id,'custom','custom','Invalid estimate',0 from daily_plans limit 1",[],"23514")
  await reject("insert into daily_tasks(daily_plan_id,workspace_id,source_type,task_type,title,estimated_minutes,status) select id,workspace_id,'custom','custom','Invalid completion',30,'completed' from daily_plans limit 1",[],"23514")
  // Source-backed tasks can be projected but cannot be completed through a custom-task API.
  await db.exec(`update daily_plans set status='active';insert into daily_tasks(id,daily_plan_id,workspace_id,source_type,source_id,task_type,title,estimated_minutes) select '${id(24)}',id,workspace_id,'revision','${id(25)}','revision','Source revision',30 from daily_plans where plan_date='${day}';`)
  await login(id(1))
  await reject("select public.mutate_today($1,$2::date,$3::jsonb)",["one",day,JSON.stringify({kind:"complete",taskId:id(24),version:0})],"22023")
  const before=(await db.query("select count(*)::int as n from today_activity_events")).rows[0].n
  await reject("select public.mutate_today($1,$2::date,$3::jsonb)",["one",day,JSON.stringify({kind:"add",taskId:id(26),title:"Bad task",type:"custom",minutes:-10})],"22023")
  check((await db.query("select count(*)::int as n from today_activity_events")).rows[0].n===before,"failure rolls back activity and task writes")
  await db.exec("reset role")
  await db.exec(`update workspaces set status='archived' where id='${id(11)}';`)
  await login(id(1))
  await reject("select public.mutate_today($1,$2::date,$3::jsonb)",["one",day,JSON.stringify({kind:"create_plan"})],"42501")
  console.log(`Today PostgreSQL checks passed: ${checks} (migration, constraints, RLS, transitions, rollback, idempotence).`)
} finally {await db.close()}
