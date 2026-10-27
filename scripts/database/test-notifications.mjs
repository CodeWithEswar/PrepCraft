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
const command=async(payload,requestId=id(request++))=>rpc('notification_command',['one',requestId,JSON.stringify(payload)],['text','uuid','jsonb']);

const next=async(schedule,at)=> (await db.query('select private.notification_next($1::jsonb,$2::timestamptz) next',[JSON.stringify(schedule),at])).rows[0].next;
const daily={scheduleType:'daily',timezone:'Asia/Calcutta',localTime:'08:00'};
check(new Date(await next(daily,'2026-10-25T22:00:00Z')).toISOString()==='2026-10-26T02:30:00.000Z','daily preserves local time');
check(new Date(await next({...daily,timezone:'America/New_York',localTime:'02:30'},'2026-03-08T05:00:00Z')).toISOString()==='2026-03-08T07:30:00.000Z','spring gap shifts forward');
check(new Date(await next({...daily,timezone:'America/New_York',localTime:'01:30'},'2026-11-01T04:00:00Z')).toISOString()==='2026-11-01T06:30:00.000Z','fall fold chooses one later instant');
const inbox=()=>rpc('notification_inbox',['one','{}',null,30],['text','jsonb','jsonb','integer']);
await login(id(1));check((await inbox()).items.length===0,'new account inbox empty');
const settings=await rpc('notification_settings',['one']);check(!settings.capabilities.email&&!settings.capabilities.push,'external channels unconfigured');
await rejects('select public.notification_settings($1)',['two'],'42501');
const payload={kind:'reminder.save',type:'custom',title:'Review the plan',body:'A private reminder',channels:['in_app'],respectQuietHours:false,schedule:{scheduleType:'daily',timezone:'UTC',localTime:'09:00'}};
const requestId=id(190),rem=await command(payload,requestId);check(rem.enabled,'reminder created');check((await command(payload,requestId)).id===rem.id,'same request idempotent');
await rejects('select public.notification_command($1,$2::uuid,$3::jsonb)',['one',requestId,JSON.stringify({...payload,title:'Changed'})],'40001');
await rejects('select public.notification_command($1,$2::uuid,$3::jsonb)',['one',id(191),JSON.stringify({...payload,channels:['email']})],'22023');
await rejects("insert into public.reminders(workspace_id,user_id,type,title) values($1,$2,'custom','Denied')",[id(11),id(1)],'42501');
await rejects('select private.notification_dispatch(null,null,25)',[],'42501');
await login(null,'service_role');await rejects('select public.notification_settings($1)',['one'],'42501');
await db.exec('reset role');await db.query("update reminder_schedules set next_run_at=now()-interval '1 minute' where reminder_id=$1",[rem.id]);
await login(id(1));const first=await rpc('notification_check',['one']);check(first.generated===1,'due occurrence generated');check((await rpc('notification_check',['one'])).generated===0,'dispatch replay does not duplicate');
let page=await inbox();check(page.items.length===1,'in-app delivery visible');const notification=page.items[0];check(notification.body===payload.body,'source body retained only in own inbox');
await command({kind:'notifications.bulk',ids:[notification.id],action:'save'});await command({kind:'notifications.bulk',ids:[notification.id],action:'read'});page=await inbox();check(page.items[0].savedAt&&page.items[0].readAt,'save and read independent');
await command({kind:'notifications.bulk',ids:[notification.id],action:'archive'});page=await inbox();check(page.items.length===0,'archive removes inbox row');const archive=await rpc('notification_inbox',['one',JSON.stringify({view:'archive'}),null,30],['text','jsonb','jsonb','integer']);check(archive.items[0].savedAt,'archive preserves saved state');
await command({kind:'notifications.bulk',ids:[notification.id],action:'restore'});await command({kind:'notification.snooze',id:notification.id,choice:'later_today'});check((await inbox()).items.length===0,'snooze removes row until due');
const snoozed=await rpc('notification_inbox',['one',JSON.stringify({view:'snoozed'}),null,30],['text','jsonb','jsonb','integer']);check(snoozed.items.length===1,'snooze inspectable');
await login(id(3));check((await inbox()).items.length===0,'same workspace member cannot see another inbox');await rejects('select public.notification_detail($1,$2::uuid)',['one',notification.id],'42501');await rejects('select public.notification_command($1,$2::uuid,$3::jsonb)',['one',id(194),JSON.stringify({kind:'notifications.bulk',ids:[notification.id],action:'read'})],'42501');
await login(id(1));const report=await command({kind:'report.request'});const generated=await command({kind:'report.generate',id:report.reportId});check(generated.state==='ready','weekly report commits before ready');const saved=await rpc('notification_report',['one',report.reportId],['text','uuid']);check(saved.snapshot.version===1,'report snapshot versioned');check(saved.snapshot.coverage.readiness==='unavailable','no fabricated readiness');check(saved.snapshot.core.points.length===0,'private attempt rows excluded from snapshot');
check((await command({kind:'report.generate',id:report.reportId})).duplicate,'report generation replay idempotent');
await login(id(3));await rejects('select public.notification_report($1,$2::uuid)',['one',report.reportId],'42501');await rejects('select public.notification_command($1,$2::uuid,$3::jsonb)',['one',id(195),JSON.stringify({kind:'report.generate',id:report.reportId})],'42501');
await db.exec('reset role');await rejects("update weekly_reports set timezone='Asia/Calcutta' where id=$1",[report.reportId],'22023');
await login(null,'service_role');const jobs=await rpc('notification_worker',[JSON.stringify({kind:'outbox.claim'})],['jsonb']);check(jobs.length===1&&jobs[0].kind==='report','outbox contains identifiers only');check(!JSON.stringify(jobs).includes(payload.body),'queue payload excludes private text');check((await rpc('notification_worker',[JSON.stringify({kind:'outbox.claim'})],['jsonb'])).length===0,'outbox lease prevents concurrent claim');check(!(await rpc('notification_worker',[JSON.stringify({kind:'outbox.ack',id:jobs[0].id,leaseToken:id(999)})],['jsonb'])).acknowledged,'stale publisher cannot acknowledge');check((await rpc('notification_worker',[JSON.stringify({kind:'outbox.ack',id:jobs[0].id,leaseToken:jobs[0].leaseToken})],['jsonb'])).acknowledged,'publisher lease acknowledged');
await db.exec('reset role');check((await db.query("select has_function_privilege('anon','public.notification_worker(jsonb)','execute') allowed")).rows[0].allowed===false,'anon worker execution revoked');check((await db.query("select has_function_privilege('authenticated','private.notification_emit(public.reminders,text,timestamptz,jsonb,uuid)','execute') allowed")).rows[0].allowed===false,'private emit inaccessible');

await db.exec('reset role');
const quiet={quietEnabled:true,quietStart:'22:30',quietEnd:'07:00',timezone:'Asia/Calcutta'};
const q=async(at)=>new Date((await db.query('select private.notification_quiet_until($1::jsonb,$2::timestamptz) at',[JSON.stringify(quiet),at])).rows[0].at).toISOString();
check(await q('2026-10-26T18:00:00Z')==='2026-10-27T01:30:00.000Z','midnight-crossing quiet hours defer to next local morning');
check(await q('2026-10-26T00:00:00Z')==='2026-10-26T01:30:00.000Z','early morning quiet time keeps local date');
check(await q('2026-10-26T01:30:00Z')==='2026-10-26T01:30:00.000Z','quiet end is exclusive');
check(new Date(await next({scheduleType:'selected_days',timezone:'UTC',localTime:'08:00',daysOfWeek:[2,4]},'2026-10-26T09:00:00Z')).toISOString()==='2026-10-27T08:00:00.000Z','selected weekdays canonical');
check(await next({scheduleType:'once',timezone:'UTC',absoluteAt:'2026-10-25T08:00:00Z'},'2026-10-26T09:00:00Z')===null,'past once schedule has no next occurrence');
await login(id(1));await rejects('select public.notification_inbox($1,$2::jsonb,null,null)',['one','{}'],'22023');
await command({kind:'preference.save',scope:'account',family:'*',inApp:false,email:false,push:false,quietEnabled:false,quietStart:'22:30',quietEnd:'07:00',timezone:'UTC',pushPrivacy:'private'});
check(!(await rpc('notification_settings',['one'])).effective.inApp,'account preference inherited');
await command({kind:'preference.save',scope:'workspace',family:'*',inApp:true,email:false,push:false,quietEnabled:false,quietStart:'22:30',quietEnd:'07:00',timezone:'UTC',pushPrivacy:'private'});
check((await rpc('notification_settings',['one'])).effective.inApp,'workspace preference overrides account');
await command({kind:'preference.reset',scope:'workspace',family:'*'});check(!(await rpc('notification_settings',['one'])).effective.inApp,'workspace reset restores inherited preference');
await command({kind:'preference.save',scope:'account',family:'*',inApp:true,email:false,push:false,quietEnabled:false,quietStart:'22:30',quietEnd:'07:00',timezone:'UTC',pushPrivacy:'private'});
await db.exec('reset role');await db.query("insert into daily_plans(id,workspace_id,plan_date,timezone,context_version,status) values($1,$2,current_date,'UTC','test','active')",[id(800),id(11)]);
await db.query("insert into daily_tasks(id,daily_plan_id,workspace_id,source_type,task_type,title,estimated_minutes,scheduled_start,scheduled_end) values($1,$2,$3,'custom','dsa','Scheduled focus',30,now()+interval '2 hours',now()+interval '150 minutes')",[id(801),id(800),id(11)]);
await login(id(1));const relative=await command({...payload,type:'upcoming_session',title:'Focus session',sourceType:'task',sourceId:id(801),respectQuietHours:true,schedule:{scheduleType:'event_relative',timezone:'UTC',offsetMinutes:-30}});
const before=(await rpc('notification_settings',['one'])).reminders.find(r=>r.id===relative.id).nextRunAt;
await db.exec('reset role');check((await db.query("select private.notification_source(r,now())->>'category' category from reminders r where id=$1",[relative.id])).rows[0].category==='plan','scheduled practice does not imply a real interview event');
await db.exec('reset role');await db.query("update daily_tasks set scheduled_start=scheduled_start+interval '1 hour',scheduled_end=scheduled_end+interval '1 hour' where id=$1",[id(801)]);
await login(id(1));const after=(await rpc('notification_settings',['one'])).reminders.find(r=>r.id===relative.id).nextRunAt;
check(Date.parse(after)-Date.parse(before)===3600000,'task move updates relative reminder');
await db.exec('reset role');await db.query("update daily_tasks set status='deferred' where id=$1",[id(801)]);
await login(id(1));check((await rpc('notification_settings',['one'])).reminders.find(r=>r.id===relative.id).nextRunAt===null,'handled source cancels relative schedule');
await db.exec('reset role');await db.query("update workspace_targets set target_date=current_date+30 where workspace_id=$1",[id(11)]);
await login(id(1));const target=await command({...payload,type:'target_deadline',title:'Target reminder',sourceType:'target',sourceId:id(11),respectQuietHours:true,schedule:{scheduleType:'event_relative',timezone:'UTC',offsetMinutes:-1440}});
await db.exec('reset role');await db.query("update workspace_targets set target_date=target_date+1 where workspace_id=$1",[id(11)]);
await login(id(1));check(!!(await rpc('notification_settings',['one'])).reminders.find(r=>r.id===target.id).nextRunAt,'target-date trigger follows source without task-only fields');
const updated=await command({...payload,id:rem.id,version:0,title:'Adjusted reminder'});check(updated.version===1,'editing uses optimistic version and explicit channels');
const archived=await command({kind:'reminder.archive',id:rem.id,version:1});check(!archived.enabled,'archiving disables schedule');
await rejects('select public.notification_command($1,$2::uuid,$3::jsonb)',['one',id(196),JSON.stringify({kind:'reminder.toggle',id:rem.id,version:1})],'22023');
await db.exec('reset role');await db.query("update workspace_members set status='removed' where workspace_id=$1 and user_id=$2",[id(11),id(1)]);
await login(id(1));await rejects('select public.notification_settings($1)',['one'],'42501');
check((await db.query('select count(*)::integer n from public.notifications')).rows[0].n===0,'revoked membership hides direct rows');
await db.exec('reset role');await db.query("update workspace_members set status='active' where workspace_id=$1 and user_id=$2",[id(11),id(1)]);
await login(null,'service_role');await rpc('notification_worker',[JSON.stringify({kind:'heartbeat',email:true,push:false})],['jsonb']);
await db.exec('reset role');await db.query("update auth.users set email='verified@example.test',email_confirmed_at=now() where id=$1",[id(1)]);
await login(id(1));await command({kind:'preference.save',scope:'workspace',family:'*',inApp:true,email:true,push:false,quietEnabled:false,quietStart:'22:30',quietEnd:'07:00',timezone:'UTC',pushPrivacy:'private'});
const emailReminder=await command({...payload,title:'Delivery fixture',channels:['in_app','email']});
await db.exec('reset role');await db.query("update reminder_schedules set next_run_at=now()-interval '1 minute' where reminder_id=$1",[emailReminder.id]);
await login(id(1));await rpc('notification_check',['one']);
await db.exec('reset role');const delivery=(await db.query("select id,notification_id from notification_deliveries where channel='email' order by created_at desc limit 1")).rows[0];
await login(null,'service_role');const claim=await rpc('notification_worker',[JSON.stringify({kind:'delivery.claim',id:delivery.id})],['jsonb']);check(claim.state==='claimed'&&claim.email==='verified@example.test','worker loads verified recipient after claim');
check((await rpc('notification_worker',[JSON.stringify({kind:'delivery.claim',id:delivery.id})],['jsonb'])).state==='wait','active delivery lease excludes duplicate consumer');
check((await rpc('notification_worker',[JSON.stringify({kind:'delivery.defer',id:delivery.id,delay:7200})],['jsonb'])).ok,'quiet wait durably reschedules outbox');
check((await rpc('notification_worker',[JSON.stringify({kind:'delivery.finish',id:delivery.id,leaseToken:id(997),status:'delivered'})],['jsonb'])).stale,'wrong lease cannot mark delivered');
await rpc('notification_worker',[JSON.stringify({kind:'delivery.finish',id:delivery.id,leaseToken:claim.leaseToken,status:'delivered',providerId:'provider-test'})],['jsonb']);
check((await rpc('notification_worker',[JSON.stringify({kind:'delivery.claim',id:delivery.id})],['jsonb'])).state==='done','accepted delivery cannot send again');
await rpc('notification_worker',[JSON.stringify({kind:'provider.event',eventId:'event-one',eventType:'email.delivered',providerId:'provider-test'})],['jsonb']);await rpc('notification_worker',[JSON.stringify({kind:'provider.event',eventId:'event-one',eventType:'email.delivered',providerId:'provider-test'})],['jsonb']);
await db.exec('reset role');check((await db.query('select count(*)::integer n from private.notification_provider_events')).rows[0].n===1,'provider event deduplicated');check((await db.query('select provider_status from notification_deliveries where id=$1',[delivery.id])).rows[0].provider_status==='email.delivered','provider acceptance distinguished from delivery');
await login(id(1));check((await inbox()).items.some(n=>n.id===delivery.notification_id),'in-app available independently of external provider');
await db.exec('reset role');
const plan=(await db.query("explain (format json) select id from public.notifications where user_id=$1 and workspace_id=$2 order by created_at desc,id desc limit 30",[id(1),id(11)])).rows[0]['QUERY PLAN'];check(JSON.stringify(plan).includes('Limit'),'inbox query has bounded database plan');

await db.query("insert into weekly_reports(id,workspace_id,user_id,period_start,period_end,timezone) values($1,$2,$3,date_trunc('week',now())::date-14,date_trunc('week',now())::date-8,'Asia/Calcutta')",[id(850),id(11),id(1)]);
await login(id(1));check((await command({kind:'report.generate',id:id(850)})).state==='ready','report generated with saved timezone');const zoned=await rpc('notification_report',['one',id(850)],['text','uuid']);check(zoned.snapshot.context.workspace.timezone==='Asia/Calcutta','report reuses Analytics with frozen timezone');
await db.exec('reset role');check((await db.query('select timezone from workspaces where id=$1',[id(11)])).rows[0].timezone==='UTC','report does not mutate workspace timezone');
await login(id(1));const weekly=await command({...payload,type:'weekly_report',title:'Weekly report',respectQuietHours:true,schedule:{scheduleType:'weekly',timezone:'UTC',localTime:'08:00',daysOfWeek:[1]}});
await db.exec('reset role');await db.query("update reminder_schedules set next_run_at=now()-interval '1 minute' where reminder_id=$1",[weekly.id]);
await login(id(1));await rpc('notification_check',['one']);check((await db.query('select status from reminder_occurrences where reminder_id=$1',[weekly.id])).rows[0].status==='generated','already-ready report publishes a later reminder occurrence');
await db.exec('reset role');
await login(id(1));const once=await command({...payload,title:'Paused one-time reminder',enabled:false,schedule:{scheduleType:'once',timezone:'UTC',absoluteAt:new Date(Date.now()+3600000).toISOString()}});
await db.exec('reset role');await db.query("update reminder_schedules set absolute_at=now()-interval '1 hour' where reminder_id=$1",[once.id]);
await login(id(1));await rejects('select public.notification_command($1,$2::uuid,$3::jsonb)',['one',id(988),JSON.stringify({kind:'reminder.toggle',id:once.id,version:0})],'22023');check(!(await rpc('notification_settings',['one'])).reminders.find(r=>r.id===once.id).enabled,'expired one-time resume keeps paused state');
await db.exec('reset role');
await db.query("insert into notifications(workspace_id,user_id,reminder_id,category,event_type,title,reason,source_type,action_type,dedupe_key,scheduled_for,available_at) select $1,$2,$3,'custom','reminder.custom','Bounded inbox fixture','Index and pagination fixture','workspace','open_workspace','fixture:'||g,now(),now() from generate_series(1,5000)g",[id(11),id(1),emailReminder.id]);
await db.query("insert into notification_deliveries(notification_id,workspace_id,user_id,channel,provider,status,idempotency_key,scheduled_for,delivered_at) select n.id,n.workspace_id,n.user_id,'in_app','postgres','delivered','fixture-delivery:'||n.id,now(),now() from notifications n where dedupe_key like 'fixture:%'");
await db.exec('analyze public.notifications');
const indexed=(await db.query("explain (format json) select id from notifications where user_id=$1 and workspace_id=$2 order by created_at desc,id desc limit 30",[id(1),id(11)])).rows[0]['QUERY PLAN'];check(JSON.stringify(indexed).includes('notifications_inbox'),'5,000-row inbox uses owner and cursor index');
await login(id(1));const paged=await inbox();check(paged.items.length===30&&paged.cursor,'cursor page bounded to 30');const second=await rpc('notification_inbox',['one','{}',JSON.stringify(paged.cursor),30],['text','jsonb','jsonb','integer']);check(!second.items.some(n=>paged.items.some(p=>p.id===n.id)),'keyset pagination does not repeat same-timestamp rows');check(paged.counts.all===501&&paged.counts.limit===500,'counts bounded and marked as capped');
console.log('Notifications PostgreSQL: '+checks+' checks passed');
}catch(error){console.error({message:error.message,code:error.code,detail:error.detail,where:error.where,position:error.position});process.exitCode=1}finally{await db.close()}

