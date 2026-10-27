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


await db.exec('alter table preparation_template_versions add unique(template_id,version_number)');
await db.exec(await fs.readFile('supabase/migrations/20261025124046_behavioral_story_system.sql','utf8'));
await db.exec(await fs.readFile('supabase/migrations/20261025150000_mock_interview_simulation_engine.sql','utf8'));
await db.exec(await fs.readFile('supabase/migrations/20261025180527_analytics_evidence_read_models.sql','utf8'));
await db.exec(await fs.readFile('supabase/migrations/20261025195405_analytics_interview_read_model_cleanup.sql','utf8'));
await db.exec('alter table workspace_targets add column target_date date;alter table auth.users add column email text,add column email_confirmed_at timestamptz');
await db.exec(await fs.readFile('supabase/migrations/20261025203311_notification_delivery_platform.sql','utf8'));
await db.exec(await fs.readFile('supabase/migrations/20261027073947_notification_function_contract_cleanup.sql','utf8'));
await db.exec(await fs.readFile('supabase/migrations/20261027081645_reminder_resume_future_guard.sql','utf8'));
await db.exec(await fs.readFile('supabase/migrations/20261027083236_planned_session_notification_category.sql','utf8'));

const login=async(user,role='authenticated')=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||'']);await db.exec('set role '+role)};
const rpc=async(name,args=[],types=[]) => (await db.query('select public.'+name+'('+args.map((_,i)=>'$'+(i+1)+(types[i]?'::'+types[i]:'')).join(',')+') result',args)).rows[0].result;
const notificationCommand=async(payload,requestId=id(request++))=>rpc('notification_command',['one',requestId,JSON.stringify(payload)],['text','uuid','jsonb']);

await db.exec(await fs.readFile('supabase/migrations/20261027095015_private_files_and_platform_jobs.sql','utf8'));
await db.exec(await fs.readFile('supabase/migrations/20261027114028_platform_recovery_and_indexes.sql','utf8'));
const command=async(payload,requestId=id(request++))=>rpc('platform_file_command',['one',requestId,JSON.stringify(payload)],['text','uuid','jsonb']);
const worker=payload=>rpc('platform_worker',[JSON.stringify({environment:'production',...payload})],['jsonb']);
const list=()=>rpc('platform_files',['one']);
await login(id(1));await rejects('select public.platform_worker($1::jsonb)',['{}'],'42501');
await rejects('select public.platform_files($1)',['two'],'42501');
await rejects('select public.platform_file_command($1,$2::uuid,$3::jsonb)',['one',id(1000),JSON.stringify({kind:'upload',name:'resume.pdf',category:'resume',mime:'application/pdf',bytes:20,checksum:'a'.repeat(64)})],'22023');
await login(null,'service_role');await worker({kind:'dispatch'});
await login(id(1));const grant=await command({kind:'upload',name:'resume.pdf',category:'resume',mime:'application/pdf',bytes:20,checksum:'a'.repeat(64)});
check(grant.token.length===64,'opaque grant');check(grant.file.status==='PENDING_UPLOAD','pending until bytes verified');
check(!(await list()).items[0].key,'object keys absent from DTO');
await login(id(3));check((await list()).items.length===0,'another member cannot read owner files');
await rejects('select public.platform_file_command($1,$2::uuid,$3::jsonb)',['one',id(1001),JSON.stringify({kind:'download',id:grant.file.id})],'42501');
await login(null,'anon');await rejects('select public.platform_files($1)',['one'],'42501');
await login(null,'service_role');
check((await worker({kind:'file.claim',purpose:'upload',token:'a'.repeat(64)})).state==='denied','unknown capability denied');
const claim=await worker({kind:'file.claim',purpose:'upload',token:grant.token});check(claim.state==='claimed','valid capability leased');
check((await worker({kind:'file.claim',purpose:'upload',token:grant.token})).state==='busy','parallel upload excluded');
await rejects('select public.platform_worker($1::jsonb)',[JSON.stringify({environment:'production',kind:'file.finish',operationId:claim.operationId,leaseToken:claim.leaseToken,status:'ready',checksum:'b'.repeat(64),bytes:20,etag:'test'})],'22023');
const finish={kind:'file.finish',operationId:claim.operationId,leaseToken:claim.leaseToken,status:'ready',checksum:'a'.repeat(64),bytes:20,etag:'test'};
check((await worker(finish)).state==='ready','verified bytes finalize');
check((await worker(finish)).duplicate,'finalization idempotent');
await login(id(1));const download=await command({kind:'download',id:grant.file.id});
await login(null,'service_role');check((await worker({kind:'file.claim',purpose:'download',token:download.token})).state==='claimed','download granted');
check((await worker({kind:'file.claim',purpose:'download',token:download.token})).state==='denied','download single use');
await login(id(1));let file=(await list()).items[0];await rejects('select public.platform_file_command($1,$2::uuid,$3::jsonb)',['one',id(1002),JSON.stringify({kind:'delete',id:file.id,version:0})],'40001');
await command({kind:'delete',id:file.id,version:file.version});
await login(null,'service_role');const jobs=await worker({kind:'dispatch'});check(jobs.length===1,'deletion has durable job');
await worker({kind:'job.published',id:jobs[0].id,leaseToken:jobs[0].leaseToken});
const job=await worker({kind:'job.claim',id:jobs[0].id,eventId:jobs[0].eventId,jobKind:'file.delete'});check(job.state==='claimed','delete job leased');
await worker({kind:'job.finished',id:job.id,leaseToken:job.leaseToken});
check((await worker({kind:'job.claim',id:jobs[0].id,eventId:jobs[0].eventId,jobKind:'file.delete'})).state==='done','redelivery idempotent');
await login(id(1));check((await list()).items.length===0,'deleted metadata hidden');
await rejects("insert into public.files(workspace_id,owner_user_id) values($1,$2)",[id(11),id(1)],'42501');
const revoked=await command({kind:'upload',name:'revoked.txt',category:'attachment',mime:'text/plain',bytes:20,checksum:'c'.repeat(64)});
await login(null,'service_role');const revokedClaim=await worker({kind:'file.claim',purpose:'upload',token:revoked.token});
await db.exec('reset role');await db.query("update workspace_members set status='revoked' where workspace_id=$1 and user_id=$2",[id(11),id(1)]);
await login(null,'service_role');check((await worker({kind:'file.finish',operationId:revokedClaim.operationId,leaseToken:revokedClaim.leaseToken,status:'ready',checksum:'c'.repeat(64),bytes:20,etag:'revoked'})).state==='stale','revocation checked at finalization');
await login(id(1));await rejects('select public.platform_replay($1::uuid,$2::uuid,$3)',[jobs[0].id,id(1008),'operator_reviewed'],'42501');
await db.exec('reset role');await db.query("update private.platform_jobs set status='failed' where id=$1",[jobs[0].id]);
await login(null,'service_role');const replay=await rpc('platform_replay',[jobs[0].id,id(1009),'dependency_recovered'],['uuid','uuid','text']);check(replay.replayed&&replay.eventId===jobs[0].eventId,'audited replay preserves event identity');check(!(await rpc('platform_replay',[jobs[0].id,id(1010),'operator_reviewed'],['uuid','uuid','text'])).replayed,'active replay is idempotent');
console.log(JSON.stringify({checks,status:'passed'}));
}finally{await db.close()}
