-- Phase 18: Supabase owns schedules, inbox state, snapshots and delivery history.
-- Cron/Queues execute bounded work; no external provider is enabled by this migration.
create table public.reminders (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 type text not null check(type in ('custom','daily_plan','revision_due','weekly_target','weekly_report','upcoming_session','target_deadline')),
 title text not null check(length(btrim(title)) between 1 and 160),body text not null default '' check(length(body)<=1000),source_type text not null default 'workspace' check(source_type in ('workspace','task','target','custom')),source_id uuid,
 priority text not null default 'normal' check(priority in ('normal','important')),channels text[] not null default array['in_app'] check(cardinality(channels) between 1 and 3 and channels<@array['in_app','email','push']),
 enabled boolean not null default true,respect_quiet_hours boolean not null default true,version integer not null default 0,archived_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(id,workspace_id,user_id),check(archived_at is null or not enabled),check(type='custom' or respect_quiet_hours),check((source_type in ('task','target'))=(source_id is not null)),check(type<>'upcoming_session' or source_type='task'),check(type<>'target_deadline' or source_type='target')
);
create index reminders_owner on public.reminders(user_id,workspace_id,created_at desc);
create index reminders_source on public.reminders(workspace_id,source_type,source_id) where source_id is not null;
create table public.reminder_schedules (
 id uuid primary key default gen_random_uuid(),reminder_id uuid not null unique,workspace_id uuid not null,user_id uuid not null,
 schedule_type text not null check(schedule_type in ('once','daily','weekly','selected_days','event_relative')),timezone text not null,local_time time(0),days_of_week integer[],local_date date,absolute_at timestamptz,anchor_at timestamptz,offset_minutes integer check(offset_minutes between -10080 and 0),
 next_run_at timestamptz,last_run_at timestamptz,last_occurrence_key text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(reminder_id,workspace_id,user_id) references public.reminders(id,workspace_id,user_id) on delete cascade,
 check(local_time is null or extract(second from local_time)=0),check(days_of_week is null or (cardinality(days_of_week) between 1 and 7 and days_of_week<@array[0,1,2,3,4,5,6])),
 check(case schedule_type when 'once' then ((local_date is not null and local_time is not null and absolute_at is null) or (absolute_at is not null and local_date is null and local_time is null)) and days_of_week is null and offset_minutes is null
 when 'daily' then local_time is not null and local_date is null and absolute_at is null and days_of_week is null and offset_minutes is null
 when 'weekly' then local_time is not null and cardinality(days_of_week)=1 and local_date is null and absolute_at is null and offset_minutes is null
 when 'selected_days' then local_time is not null and cardinality(days_of_week) between 1 and 7 and local_date is null and absolute_at is null and offset_minutes is null
 when 'event_relative' then offset_minutes is not null and local_time is null and local_date is null and absolute_at is null and days_of_week is null else false end)
);
create index reminder_schedules_due on public.reminder_schedules(next_run_at,id) where next_run_at is not null;
create index reminder_schedules_owner on public.reminder_schedules(user_id,workspace_id);
create table public.notification_preferences (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,workspace_id uuid references public.workspaces(id) on delete cascade,
 event_family text not null check(event_family in ('*','plan','revision','practice','interview','application','report','workspace','system','custom')),
 in_app_enabled boolean not null default true,email_enabled boolean not null default false,push_enabled boolean not null default false,
 quiet_enabled boolean not null default true,quiet_start time(0) not null default '22:30',quiet_end time(0) not null default '07:00',timezone text not null default 'UTC',push_privacy text not null default 'private' check(push_privacy in ('private','detailed')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique nulls not distinct(user_id,workspace_id,event_family),check(quiet_start<>quiet_end)
);
create table public.weekly_reports (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 period_start date not null,period_end date not null,timezone text not null,policy_version text not null default 'weekly-report-v1' check(policy_version='weekly-report-v1'),
 status text not null default 'pending' check(status in ('pending','generating','ready','failed')),summary_json jsonb,source_coverage jsonb not null default '{}',generated_at timestamptz,published_at timestamptz,
 attempt_count integer not null default 0,lease_token uuid,lease_until timestamptz,failure_code text,created_at timestamptz not null default now(),
 unique(workspace_id,user_id,period_start,policy_version),unique(id,workspace_id,user_id),check(period_end=period_start+6 and extract(isodow from period_start)=1),check(summary_json is null or (jsonb_typeof(summary_json)='object' and octet_length(summary_json::text)<=500000)),check((status='ready')=(summary_json is not null and generated_at is not null and published_at is not null))
);
create index weekly_reports_history on public.weekly_reports(user_id,workspace_id,period_start desc);
create table public.notifications (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,reminder_id uuid references public.reminders(id) on delete set null,report_id uuid,
 category text not null check(category in ('plan','revision','practice','interview','application','report','workspace','system','custom')),event_type text not null check(length(event_type)<=80),template_version text not null default 'notification-template-v1',
 title text not null check(length(title) between 1 and 160),body text not null default '' check(length(body)<=1200),reason text not null check(length(reason)<=1200),context jsonb not null default '{}' check(jsonb_typeof(context)='object' and octet_length(context::text)<=12000),
 source_type text not null check(source_type in ('workspace','task','target','custom','report')),source_id uuid,action_type text not null check(action_type in ('view_today','start_revision','view_weekly_plan','view_report','view_task','view_target','open_workspace')),
 priority text not null default 'normal' check(priority in ('normal','important')),state text not null default 'available' check(state in ('pending','available','read','archived')),dedupe_key text not null check(length(dedupe_key)<=160),scheduled_for timestamptz not null,available_at timestamptz not null,expires_at timestamptz,
 read_at timestamptz,saved_at timestamptz,archived_at timestamptz,resolved_at timestamptz,resolution_code text,snoozed_until timestamptz,source_checked_at timestamptz not null default now(),created_at timestamptz not null default now(),
 unique(user_id,workspace_id,dedupe_key),unique(id,workspace_id,user_id),foreign key(report_id,workspace_id,user_id) references public.weekly_reports(id,workspace_id,user_id),check((state='archived')=(archived_at is not null))
);
create index notifications_inbox on public.notifications(user_id,workspace_id,created_at desc,id desc);
create index notifications_unread on public.notifications(user_id,workspace_id,created_at desc,id desc) where read_at is null and state='available';
create index notifications_reconcile on public.notifications(source_checked_at,id) where resolved_at is null and state in ('available','read');
create index notifications_pending on public.notifications(available_at,id) where state='pending';
create index notifications_reminder on public.notifications(reminder_id) where reminder_id is not null;
create index notifications_report on public.notifications(report_id) where report_id is not null;
create table public.reminder_occurrences (
 id uuid primary key default gen_random_uuid(),reminder_id uuid not null,workspace_id uuid not null,user_id uuid not null,occurrence_key text not null,scheduled_for timestamptz not null,
 status text not null check(status in ('generated','deferred','suppressed','awaiting_report')),notification_id uuid,report_id uuid,reason_code text,processed_at timestamptz not null default now(),created_at timestamptz not null default now(),
 unique(reminder_id,occurrence_key),foreign key(reminder_id,workspace_id,user_id) references public.reminders(id,workspace_id,user_id) on delete cascade,foreign key(notification_id,workspace_id,user_id) references public.notifications(id,workspace_id,user_id),foreign key(report_id,workspace_id,user_id) references public.weekly_reports(id,workspace_id,user_id)
);
create index reminder_occurrences_owner on public.reminder_occurrences(user_id,workspace_id,scheduled_for desc);
create index reminder_occurrences_notification on public.reminder_occurrences(notification_id) where notification_id is not null;
create index reminder_occurrences_report on public.reminder_occurrences(report_id) where report_id is not null;
create table public.notification_deliveries (
 id uuid primary key default gen_random_uuid(),notification_id uuid not null,workspace_id uuid not null,user_id uuid not null,channel text not null check(channel in ('in_app','email','push')),provider text not null,
 status text not null default 'pending' check(status in ('pending','queued','processing','delivered','failed','suppressed','cancelled')),attempt_count integer not null default 0 check(attempt_count between 0 and 6),provider_message_id text,provider_status text,idempotency_key text not null unique,
 scheduled_for timestamptz not null,first_attempt_at timestamptz,last_attempt_at timestamptz,delivered_at timestamptz,failed_at timestamptz,failure_code text check(length(failure_code)<=80),lease_token uuid,lease_until timestamptz,render_snapshot jsonb,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(notification_id,channel),foreign key(notification_id,workspace_id,user_id) references public.notifications(id,workspace_id,user_id) on delete cascade
);
create index notification_deliveries_owner on public.notification_deliveries(user_id,workspace_id,created_at desc);
create index notification_deliveries_ready on public.notification_deliveries(scheduled_for,id) where status in ('pending','queued','processing');
create table public.notification_actions (
 id bigint generated always as identity primary key,workspace_id uuid not null references public.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,notification_id uuid,reminder_id uuid,
 event_type text not null check(length(event_type)<=80),request_id uuid not null,request_hash text not null,response jsonb not null default '{}' check(octet_length(response::text)<=20000),created_at timestamptz not null default now(),unique(user_id,request_id),
 foreign key(notification_id,workspace_id,user_id) references public.notifications(id,workspace_id,user_id),foreign key(reminder_id,workspace_id,user_id) references public.reminders(id,workspace_id,user_id)
);
create index notification_actions_owner on public.notification_actions(user_id,workspace_id,created_at desc);
create index notification_actions_notification on public.notification_actions(notification_id) where notification_id is not null;
create index notification_actions_reminder on public.notification_actions(reminder_id) where reminder_id is not null;
create table public.push_subscriptions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,endpoint_hash text not null,provider text not null,device_name text not null check(length(device_name) between 1 and 80),created_at timestamptz not null default now(),last_used_at timestamptz,revoked_at timestamptz,
 constraint push_subscriptions_owner_endpoint unique(user_id,endpoint_hash),unique(id,user_id)
);
create table private.notification_push_credentials (
 subscription_id uuid primary key,user_id uuid not null,endpoint text not null,p256dh text not null,auth text not null,
 foreign key(subscription_id,user_id) references public.push_subscriptions(id,user_id) on delete cascade
);
create table private.notification_outbox (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,kind text not null check(kind in ('delivery','report')),entity_id uuid not null,
 idempotency_key text not null unique,scheduled_for timestamptz not null,status text not null default 'pending' check(status in ('pending','publishing','published','failed','cancelled')),publish_attempts integer not null default 0,lease_token uuid,lease_until timestamptz,published_at timestamptz,last_failure_code text,created_at timestamptz not null default now()
);
create index notification_outbox_due on private.notification_outbox(scheduled_for,id) where status in ('pending','publishing');
create index notification_outbox_scope on private.notification_outbox(user_id,workspace_id);
create table private.notification_runtime (
 id boolean primary key default true check(id),dispatcher_enabled boolean not null default false,email_enabled boolean not null default false,push_enabled boolean not null default false,push_public_key text,last_dispatch_at timestamptz,last_success_at timestamptz,last_failure_code text
);
insert into private.notification_runtime(id) values(true);
create table private.notification_provider_events (
 provider text not null,event_id text not null,delivery_id uuid references public.notification_deliveries(id),event_type text not null,created_at timestamptz not null default now(),primary key(provider,event_id)
);
create index notification_provider_events_delivery on private.notification_provider_events(delivery_id) where delivery_id is not null;

-- Explicit grants survive the October 2026 Data API default-grant change.
do $$declare t text;begin
 foreach t in array array['reminders','reminder_schedules','notification_preferences','weekly_reports','notifications','reminder_occurrences','notification_deliveries','notification_actions'] loop
  execute 'alter table public.'||t||' enable row level security';execute 'alter table public.'||t||' force row level security';
  execute 'revoke all on public.'||t||' from public,anon,authenticated,service_role';execute 'grant select on public.'||t||' to authenticated';
  execute 'create policy notification_owned_read on public.'||t||' for select to authenticated using(user_id=(select auth.uid()) and (workspace_id is null or public.is_workspace_member(workspace_id)))';
 end loop;
end $$;
create function private.notification_source(r public.reminders,p_at timestamptz) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare w public.workspaces%rowtype;t public.daily_tasks%rowtype;n integer;minutes integer;target date;category text;anchor timestamptz;begin
 select * into w from public.workspaces where id=r.workspace_id;
 if w.status<>'active' or not exists(select 1 from public.workspace_members where workspace_id=r.workspace_id and user_id=r.user_id and status='active') then return jsonb_build_object('valid',false,'code','workspace_unavailable');end if;
 if r.archived_at is not null or not r.enabled then return jsonb_build_object('valid',false,'code','reminder_disabled');end if;
 if r.source_type='task' then select * into t from public.daily_tasks where id=r.source_id and workspace_id=r.workspace_id;if t.id is null or t.status in ('completed','cancelled','deferred','skipped') or t.scheduled_start is null then return jsonb_build_object('valid',false,'code','source_handled');end if;anchor:=t.scheduled_start;if r.type='upcoming_session' and anchor<=p_at then return jsonb_build_object('valid',false,'code','source_past');end if;
 elsif r.source_type='target' then select target_date into target from public.workspace_targets where workspace_id=r.workspace_id;if target is null or target<(p_at at time zone w.timezone)::date then return jsonb_build_object('valid',false,'code','source_past');end if;anchor:=(target+time '09:00') at time zone w.timezone;end if;
 category:=case r.type when 'daily_plan' then 'plan' when 'revision_due' then 'revision' when 'weekly_target' then 'plan' when 'weekly_report' then 'report' when 'upcoming_session' then 'interview' when 'target_deadline' then 'workspace' else 'custom' end;
 if r.type='daily_plan' then
  select count(*),sum(x.estimated_minutes) into n,minutes from public.daily_tasks x join public.daily_plans p on p.id=x.daily_plan_id where p.workspace_id=r.workspace_id and p.plan_date=(p_at at time zone w.timezone)::date and p.status='active' and x.status in ('planned','in_progress') and not exists(select 1 from public.planning_availability_overrides o where o.workspace_id=p.workspace_id and o.plan_date=p.plan_date and o.rest);
  if n=0 then return jsonb_build_object('valid',false,'code','plan_handled');end if;
  return jsonb_build_object('valid',true,'category',category,'title','Your plan is ready for today.','body',n||' preparation tasks are planned.','reason','These tasks are still open in today''s workspace plan. Estimated minutes are planned time, not recorded focus.','action','view_today','count',n,'estimateMinutes',minutes,'expiresAt',(((p_at at time zone w.timezone)::date+1)::timestamp at time zone w.timezone));
 elsif r.type='revision_due' then
  select count(*) into n from public.revision_items where workspace_id=r.workspace_id and user_id=r.user_id and state in ('scheduled','snoozed') and due_at<=p_at;
  if n=0 then return jsonb_build_object('valid',false,'code','revision_handled');end if;
  return jsonb_build_object('valid',true,'category',category,'title','Revision is ready when you are.','body',n||' questions or concepts are due for revision.','reason','These items reached the interval scheduled by the shared Revision engine.','action','start_revision','count',n,'expiresAt',p_at+interval '1 day');
 elsif r.type='weekly_target' then
  select count(*) into n from public.daily_tasks x join public.daily_plans p on p.id=x.daily_plan_id where p.workspace_id=r.workspace_id and p.plan_date between date_trunc('week',p_at at time zone w.timezone)::date and date_trunc('week',p_at at time zone w.timezone)::date+6 and p.status='active' and x.status in ('planned','in_progress');
  if n=0 then return jsonb_build_object('valid',false,'code','plan_handled');end if;
  return jsonb_build_object('valid',true,'category',category,'title','A moment to review your week.','body',n||' workspace tasks remain in this week''s plan.','reason','Your enabled weekly reminder checks the authoritative plan. It does not infer missed-session reasons or goal completion from estimates.','action','view_weekly_plan','count',n,'expiresAt',((date_trunc('week',p_at at time zone w.timezone)::date+7)::timestamp at time zone w.timezone));
 elsif r.type='upcoming_session' then return jsonb_build_object('valid',true,'category',category,'title','A planned session is coming up.','body',t.title,'reason','You scheduled a reminder relative to this task. Changes to its scheduled time update the reminder.','action','view_task','anchorAt',anchor,'expiresAt',anchor);
 elsif r.type='target_deadline' then return jsonb_build_object('valid',true,'category',category,'title','Your target date is approaching.','body','Review the next preparation step for your workspace.','reason','This reminder follows the target date saved in your workspace.','action','view_target','anchorAt',anchor,'expiresAt',anchor+interval '1 day');
 elsif r.type='weekly_report' then return jsonb_build_object('valid',true,'category',category,'action','view_report');
 end if;
 return jsonb_build_object('valid',true,'category','custom','title',r.title,'body',r.body,'reason','You created this reminder and selected its schedule.','action',case r.source_type when 'task' then 'view_task' when 'target' then 'view_target' else 'open_workspace' end,'anchorAt',anchor,'expiresAt',coalesce(anchor+interval '1 day',p_at+interval '7 days'));
end $$;

create function private.notification_emit(r public.reminders,p_key text,p_due timestamptz,p_source jsonb,p_report uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare pref jsonb;available timestamptz;notification uuid;delivery uuid;channel text;begin
 pref:=private.notification_preference(r.user_id,r.workspace_id,p_source->>'category');available:=case when r.respect_quiet_hours then private.notification_quiet_until(pref,greatest(p_due,now())) else greatest(p_due,now()) end;
 insert into public.notifications(workspace_id,user_id,reminder_id,report_id,category,event_type,title,body,reason,context,source_type,source_id,action_type,priority,state,dedupe_key,scheduled_for,available_at,expires_at)
 values(r.workspace_id,r.user_id,r.id,p_report,p_source->>'category',case when p_report is not null then 'report.weekly_ready' else 'reminder.'||r.type end,left(p_source->>'title',160),coalesce(p_source->>'body',''),p_source->>'reason',jsonb_strip_nulls(jsonb_build_object('count',p_source->'count','estimateMinutes',p_source->'estimateMinutes','anchorAt',p_source->'anchorAt','capturedAt',now())),case when p_report is not null then 'report' else r.source_type end,coalesce(p_report,r.source_id),p_source->>'action',r.priority,case when available>now() or not(pref->>'inApp')::boolean or not('in_app'=any(r.channels)) then 'pending' else 'available' end,p_key,p_due,available,(p_source->>'expiresAt')::timestamptz)
 on conflict(user_id,workspace_id,dedupe_key) do nothing returning id into notification;
 if notification is null then select id into notification from public.notifications where user_id=r.user_id and workspace_id=r.workspace_id and dedupe_key=p_key;return notification;end if;
 foreach channel in array r.channels loop
  if (channel='in_app' and (pref->>'inApp')::boolean) or (channel='email' and (pref->>'email')::boolean) or (channel='push' and (pref->>'push')::boolean) then
   insert into public.notification_deliveries(notification_id,workspace_id,user_id,channel,provider,status,idempotency_key,scheduled_for,delivered_at)
   values(notification,r.workspace_id,r.user_id,channel,case channel when 'in_app' then 'postgres' when 'email' then 'resend' else 'web_push' end,case when channel='in_app' and available<=now() then 'delivered' else 'pending' end,'delivery:'||notification||':'||channel,available,case when channel='in_app' and available<=now() then now() end) returning id into delivery;
   if channel<>'in_app' then insert into private.notification_outbox(workspace_id,user_id,kind,entity_id,idempotency_key,scheduled_for) values(r.workspace_id,r.user_id,'delivery',delivery,'delivery:'||delivery,available);end if;
  end if;
 end loop;return notification;
end $$;

create function private.notification_current(n public.notifications,p_at timestamptz) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r public.reminders%rowtype;begin
 if not exists(select 1 from public.workspaces w join public.workspace_members m on m.workspace_id=w.id where w.id=n.workspace_id and w.status='active' and m.user_id=n.user_id and m.status='active') then return jsonb_build_object('valid',false,'code','workspace_unavailable');end if;
 if n.expires_at is not null and n.expires_at<=p_at then return jsonb_build_object('valid',false,'code','expired');end if;
 if n.resolved_at is not null or n.state='archived' then return jsonb_build_object('valid',false,'code','already_handled');end if;
 if n.report_id is not null then return jsonb_build_object('valid',exists(select 1 from public.weekly_reports where id=n.report_id and status='ready'),'code','report_unavailable');end if;
 if n.reminder_id is null then return jsonb_build_object('valid',false,'code','reminder_unavailable');end if;
 select * into r from public.reminders where id=n.reminder_id;return private.notification_source(r,p_at);
end $$;

create function private.notification_dispatch(p_user uuid default null,p_workspace uuid default null,p_limit integer default 25) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.reminder_schedules%rowtype;r public.reminders%rowtype;n public.notifications%rowtype;source jsonb;pref jsonb;notification uuid;report uuid;occurrence uuid;key text;next_at timestamptz;start_day date;processed integer:=0;generated integer:=0;suppressed integer:=0;deferred integer:=0;begin
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'Invalid dispatch batch' using errcode='22023';end if;
 if current_setting('role',true)<>'service_role' and (p_user is distinct from (select auth.uid()) or p_workspace is null or not public.is_workspace_member(p_workspace)) then raise exception 'Dispatcher scope denied' using errcode='42501';end if;
 for r in select rm.* from public.reminders rm join public.reminder_schedules x on x.reminder_id=rm.id where x.next_run_at<=now() and rm.enabled and rm.archived_at is null and (p_user is null or rm.user_id=p_user) and (p_workspace is null or rm.workspace_id=p_workspace) order by x.next_run_at,x.id limit p_limit for no key update of rm skip locked loop
  select * into s from public.reminder_schedules where reminder_id=r.id for update;
  if s.next_run_at is null or s.next_run_at>now() then continue;end if;
  source:=private.notification_source(r,now());key:='rem:'||r.id||':'||to_char(s.next_run_at at time zone 'UTC','YYYYMMDDHH24MISS');
  insert into public.reminder_occurrences(reminder_id,workspace_id,user_id,occurrence_key,scheduled_for,status) values(r.id,r.workspace_id,r.user_id,key,s.next_run_at,'suppressed') on conflict(reminder_id,occurrence_key) do nothing returning id into occurrence;
  if occurrence is not null then
   if s.next_run_at<now()-interval '7 days' and s.schedule_type in ('once','event_relative') then source:=jsonb_build_object('valid',false,'code','missed_window');end if;
   if not(source->>'valid')::boolean then update public.reminder_occurrences set reason_code=source->>'code' where id=occurrence;suppressed:=suppressed+1;
   elsif r.type='weekly_report' then
    start_day:=date_trunc('week',now() at time zone s.timezone)::date-7;
    insert into public.weekly_reports(workspace_id,user_id,period_start,period_end,timezone) values(r.workspace_id,r.user_id,start_day,start_day+6,s.timezone) on conflict(workspace_id,user_id,period_start,policy_version) do nothing returning id into report;
    if report is null then select id into report from public.weekly_reports where workspace_id=r.workspace_id and user_id=r.user_id and period_start=start_day and policy_version='weekly-report-v1';end if;
    update public.reminder_occurrences set report_id=report,status='awaiting_report' where id=occurrence;
    insert into private.notification_outbox(workspace_id,user_id,kind,entity_id,idempotency_key,scheduled_for) values(r.workspace_id,r.user_id,'report',report,'report:'||report,now()) on conflict(idempotency_key) do nothing;
    if exists(select 1 from public.weekly_reports where id=report and status='ready') then perform private.notification_publish_report(report);end if;
   else
    notification:=private.notification_emit(r,key,s.next_run_at,source);
    update public.reminder_occurrences o set notification_id=notification,status=case when x.available_at>now() then 'deferred' else 'generated' end from public.notifications x where o.id=occurrence and x.id=notification;
    if (select available_at>now() from public.notifications where id=notification) then deferred:=deferred+1;else generated:=generated+1;end if;
   end if;
  end if;
  next_at:=private.notification_next(private.notification_schedule_json(s),now());
  update public.reminder_schedules set next_run_at=next_at,last_run_at=now(),last_occurrence_key=key,updated_at=now() where id=s.id;processed:=processed+1;
 end loop;
 -- Availability and in-app delivery never depend on queue publication or provider success.
 for n in select * from public.notifications x where x.state='pending' and x.available_at<=now() and (p_user is null or x.user_id=p_user) and (p_workspace is null or x.workspace_id=p_workspace) order by x.available_at,x.id limit 100 for update skip locked loop
  source:=private.notification_current(n,now());pref:=private.notification_preference(n.user_id,n.workspace_id,n.category);
  if not(source->>'valid')::boolean then update public.notifications set resolved_at=now(),resolution_code=source->>'code' where id=n.id;update public.notification_deliveries set status='cancelled',failure_code=source->>'code',updated_at=now() where notification_id=n.id and status in ('pending','queued');
  elsif exists(select 1 from public.notification_deliveries where notification_id=n.id and channel='in_app' and status in ('pending','delivered')) then
   if (pref->>'inApp')::boolean then
    next_at:=case when coalesce((select respect_quiet_hours from public.reminders where id=n.reminder_id),true) then private.notification_quiet_until(pref,now()) else now() end;
    if next_at>now() then update public.notifications set available_at=next_at where id=n.id;update public.notification_deliveries set scheduled_for=next_at where notification_id=n.id and status='pending';else update public.notifications set state=case when read_at is null then 'available' else 'read' end,snoozed_until=null where id=n.id;update public.notification_deliveries set status='delivered',delivered_at=coalesce(delivered_at,now()),updated_at=now() where notification_id=n.id and channel='in_app';end if;
   else update public.notification_deliveries set status='suppressed',failure_code='channel_disabled',updated_at=now() where notification_id=n.id and channel='in_app' and status='pending';end if;
  end if;
 end loop;
 for n in select * from public.notifications x where x.resolved_at is null and x.state in ('available','read') and x.source_checked_at<now()-interval '1 minute' and (p_user is null or x.user_id=p_user) and (p_workspace is null or x.workspace_id=p_workspace) order by x.source_checked_at,x.id limit 100 for update skip locked loop
  source:=private.notification_current(n,now());update public.notifications set source_checked_at=now(),resolved_at=case when not(source->>'valid')::boolean then now() end,resolution_code=case when not(source->>'valid')::boolean then source->>'code' end where id=n.id;
 end loop;
 if p_user is null then update private.notification_runtime set last_dispatch_at=now(),last_success_at=now(),last_failure_code=null where id;end if;
 return jsonb_build_object('processed',processed,'generated',generated,'suppressed',suppressed,'deferred',deferred);
end $$;

-- Immutable report snapshots contain bounded aggregate evidence, never private attempt bodies.
create function private.notification_report_run(p_report uuid,p_own boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare job public.weekly_reports%rowtype;w public.workspaces%rowtype;r public.reminders%rowtype;filters jsonb;core jsonb;activity jsonb;interviews jsonb;mastery jsonb;coverage jsonb:='{}';snapshot jsonb;old_subject text;old_scope text;old_timezone text;notification uuid;begin
 select * into job from public.weekly_reports where id=p_report for update skip locked;
 if job.id is null then return jsonb_build_object('state','busy');end if;
 if p_own then if job.user_id is distinct from (select auth.uid()) or not public.is_workspace_member(job.workspace_id) then raise exception 'Report access denied' using errcode='42501';end if;else perform private.notification_service_access();end if;
 if job.status='ready' then perform private.notification_publish_report(job.id);return jsonb_build_object('state','ready','reportId',job.id,'duplicate',true);end if;
 if job.attempt_count>=5 then return jsonb_build_object('state','failed','code','retry_limit');end if;
 select * into w from public.workspaces where id=job.workspace_id;
 if w.status<>'active' or not exists(select 1 from public.workspace_members where workspace_id=w.id and user_id=job.user_id and status='active') then update public.weekly_reports set status='failed',failure_code='workspace_unavailable' where id=job.id;return jsonb_build_object('state','failed','code','workspace_unavailable');end if;
 update public.weekly_reports set status='generating',attempt_count=attempt_count+1 where id=job.id;
 old_subject:=current_setting('request.jwt.claim.sub',true);old_scope:=current_setting('prepcraft.report_scope',true);old_timezone:=current_setting('prepcraft.report_timezone',true);perform set_config('request.jwt.claim.sub',job.user_id::text,true);perform set_config('prepcraft.report_scope',job.workspace_id::text||':'||job.user_id::text,true);perform set_config('prepcraft.report_timezone',job.timezone,true);
 filters:=jsonb_build_object('range','custom','from',job.period_start,'to',job.period_end,'track','all','topic','all','difficulty','all','mode','all','questionType','all','sessionType','all','cohort','coding','granularity','day','compare',true);
 begin core:=private.analytics_core(w.slug,filters)-'points'-'questions'-'calibration'-'patterns'-'relations';core:=core||jsonb_build_object('points','[]'::jsonb,'questions','[]'::jsonb,'calibration','[]'::jsonb,'patterns','[]'::jsonb,'relations','[]'::jsonb);coverage:=coverage||'{"attempts":"available"}';exception when others then core:=null;coverage:=coverage||'{"attempts":"unavailable"}';end;
 begin activity:=private.analytics_activity(w.slug,filters);coverage:=coverage||'{"activity":"available","planning":"available","revision":"available"}';exception when others then activity:=null;coverage:=coverage||'{"activity":"unavailable","planning":"unavailable","revision":"unavailable"}';end;
 begin interviews:=private.analytics_interviews(w.slug,filters,12);coverage:=coverage||'{"interviews":"available","behavioral":"available","applications":"unavailable","readiness":"unavailable"}';exception when others then interviews:=null;coverage:=coverage||'{"interviews":"unavailable","behavioral":"unavailable","applications":"unavailable","readiness":"unavailable"}';end;
 begin mastery:=private.mastery_evidence(w.slug,7,(job.period_end+1)::timestamp at time zone job.timezone);mastery:=jsonb_build_object('totals',mastery->'totals','asOf',mastery->'asOf','truncated',mastery->'truncated','policyVersion','mastery-policy-v1','kind','source_evidence_counts');coverage:=coverage||'{"mastery":"available"}';exception when others then mastery:=null;coverage:=coverage||'{"mastery":"unavailable"}';end;
 perform set_config('request.jwt.claim.sub',coalesce(old_subject,''),true);perform set_config('prepcraft.report_scope',coalesce(old_scope,''),true);perform set_config('prepcraft.report_timezone',coalesce(old_timezone,''),true);
 if core is null and activity is null then update public.weekly_reports set status='failed',failure_code='sources_unavailable',source_coverage=coverage where id=job.id;return jsonb_build_object('state','failed','code','sources_unavailable');end if;
 snapshot:=jsonb_build_object('version',1,'policyVersion','weekly-report-v1','analyticsPolicyVersion','analytics-policy-v1','timingPolicyVersion','timing-analytics-v1','periodStart',job.period_start,'periodEnd',job.period_end,'timezone',job.timezone,'generatedAt',now(),'workspace',jsonb_build_object('id',w.id,'slug',w.slug,'name',w.name,'userId',job.user_id,'timezone',w.timezone,'canEdit',false),'filters',filters,'context',coalesce(core->'context',activity->'context'),'core',core,'activity',activity,'interviews',interviews,'masteryEvidence',mastery,'coverage',coverage);
 update public.weekly_reports set status='ready',summary_json=snapshot,source_coverage=coverage,generated_at=now(),published_at=now(),failure_code=null where id=job.id;
 for r in select rm.* from public.reminders rm join public.reminder_occurrences o on o.reminder_id=rm.id where o.report_id=job.id and o.status='awaiting_report' and rm.enabled and rm.archived_at is null loop
  notification:=private.notification_emit(r,'report:'||job.id,now(),jsonb_build_object('category','report','title','Your weekly preparation report is ready.','body','A snapshot of your recorded preparation, with clear next steps.','reason','Your enabled weekly report covers the last complete Monday–Sunday in its saved timezone. Missing sources remain visible.','action','view_report'),job.id);
  update public.reminder_occurrences set status='generated',notification_id=notification where report_id=job.id and reminder_id=r.id;
 end loop;return jsonb_build_object('state','ready','reportId',job.id,'duplicate',false);
exception when insufficient_privilege then raise;when others then
 perform set_config('request.jwt.claim.sub',coalesce(old_subject,''),true);perform set_config('prepcraft.report_scope',coalesce(old_scope,''),true);perform set_config('prepcraft.report_timezone',coalesce(old_timezone,''),true);update public.weekly_reports set status='failed',summary_json=null,generated_at=null,published_at=null,failure_code='generation_failed',attempt_count=attempt_count+1 where id=p_report and status<>'ready';return jsonb_build_object('state','failed','code','generation_failed');
end $$;

create function private.notification_command(p_slug text,p_request uuid,p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare w public.workspaces%rowtype;actor uuid:=(select auth.uid());r public.reminders%rowtype;s public.reminder_schedules%rowtype;n public.notifications%rowtype;prior public.notification_actions%rowtype;result jsonb:='{}';schedule jsonb;source jsonb;kind text:=p_command->>'kind';hash text:=md5(p_command::text);id uuid;ids uuid[];action text;delivery_channels text[];scope uuid;family text;next_at timestamptz;until_at timestamptz;i integer;start_day date;endpoint text;subscription_hash text;provider text;begin
 w:=private.notification_access(p_slug,false);
 if p_request is null or p_command is null or jsonb_typeof(p_command)<>'object' or octet_length(p_command::text)>20000 then raise exception 'Invalid notification command' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtext('notifications:'||actor::text));
 select * into prior from public.notification_actions where user_id=actor and request_id=p_request;if prior.id is not null then if prior.request_hash<>hash then raise exception 'Request already used for a different change' using errcode='40001';end if;return prior.response;end if;
 if (select count(*) from public.notification_actions where user_id=actor and created_at>now()-interval '1 minute')>=60 then raise exception 'Please wait before making more changes' using errcode='P0001';end if;
 if kind like 'reminder.%' then
  perform private.notification_access(p_slug,true);
  if p_command->>'id' is not null then select * into r from public.reminders where id=(p_command->>'id')::uuid and workspace_id=w.id and user_id=actor for no key update;if r.id is null then raise exception 'Reminder not found' using errcode='42501';end if;if r.archived_at is not null then raise exception 'Archived reminders are read-only' using errcode='22023';end if;if (p_command->>'version') is null or r.version is distinct from (p_command->>'version')::integer then raise exception 'Reminder changed. Reload before saving.' using errcode='40001';end if;end if;
  if kind='reminder.save' then
   if r.id is null and (select count(*) from public.reminders where user_id=actor and workspace_id=w.id and archived_at is null)>=25 then raise exception 'This workspace supports 25 active reminder definitions' using errcode='22023';end if;
   select array_agg(distinct value) into delivery_channels from jsonb_array_elements_text(p_command->'channels');
   if cardinality(delivery_channels) not between 1 and 3 or not delivery_channels<@array['in_app','email','push'] then raise exception 'Choose valid delivery channels' using errcode='22023';end if;
   if 'email'=any(delivery_channels) and not(select email_enabled from private.notification_runtime where id) then raise exception 'Email delivery is not configured' using errcode='22023';end if;
   if 'push'=any(delivery_channels) and not(select push_enabled from private.notification_runtime where id) then raise exception 'Browser push is not configured' using errcode='22023';end if;
   if r.id is null then
    insert into public.reminders(workspace_id,user_id,type,title,body,source_type,source_id,priority,channels,enabled,respect_quiet_hours) values(w.id,actor,p_command->>'type',btrim(p_command->>'title'),coalesce(p_command->>'body',''),coalesce(p_command->>'sourceType','workspace'),(p_command->>'sourceId')::uuid,coalesce(p_command->>'priority','normal'),delivery_channels,coalesce((p_command->>'enabled')::boolean,true),coalesce((p_command->>'respectQuietHours')::boolean,true)) returning * into r;
   else update public.reminders set type=p_command->>'type',title=btrim(p_command->>'title'),body=coalesce(p_command->>'body',''),source_type=coalesce(p_command->>'sourceType','workspace'),source_id=(p_command->>'sourceId')::uuid,priority=coalesce(p_command->>'priority','normal'),channels=delivery_channels,enabled=coalesce((p_command->>'enabled')::boolean,true),respect_quiet_hours=coalesce((p_command->>'respectQuietHours')::boolean,true),version=version+1,updated_at=now() where reminders.id=r.id returning * into r;end if;
   source:=private.notification_source(r,now());schedule:=p_command->'schedule';
   if r.source_type='task' and not exists(select 1 from public.daily_tasks where daily_tasks.id=r.source_id and workspace_id=w.id and scheduled_start>now() and status in ('planned','in_progress')) then raise exception 'Choose an upcoming scheduled task in this workspace' using errcode='22023';end if;
   if r.source_type='target' and (r.source_id<>w.id or not exists(select 1 from public.workspace_targets where workspace_id=w.id and target_date>=(now() at time zone w.timezone)::date)) then raise exception 'This workspace has no upcoming target date' using errcode='22023';end if;
   if r.type in ('upcoming_session','target_deadline') and schedule->>'scheduleType'<>'event_relative' then raise exception 'This reminder must follow its source event' using errcode='22023';end if;
   if schedule->>'scheduleType'='event_relative' and r.source_type not in ('task','target') then raise exception 'Relative schedules require a supported source event' using errcode='22023';end if;
   if r.type='weekly_report' and schedule->>'scheduleType'<>'weekly' then raise exception 'Choose a weekly report schedule' using errcode='22023';end if;
   schedule:=schedule||jsonb_build_object('anchorAt',source->>'anchorAt');next_at:=private.notification_next(schedule,now());if r.enabled and next_at is null then raise exception 'Choose a future reminder time' using errcode='22023';end if;
   insert into public.reminder_schedules(reminder_id,workspace_id,user_id,schedule_type,timezone,local_time,days_of_week,local_date,absolute_at,anchor_at,offset_minutes,next_run_at)
   values(r.id,w.id,actor,schedule->>'scheduleType',schedule->>'timezone',(schedule->>'localTime')::time,case when schedule->'daysOfWeek' is not null and schedule->'daysOfWeek'<>'null'::jsonb then array(select value::integer from jsonb_array_elements_text(schedule->'daysOfWeek')) end,(schedule->>'localDate')::date,(schedule->>'absoluteAt')::timestamptz,(schedule->>'anchorAt')::timestamptz,(schedule->>'offsetMinutes')::integer,case when r.enabled then next_at end)
   on conflict(reminder_id) do update set schedule_type=excluded.schedule_type,timezone=excluded.timezone,local_time=excluded.local_time,days_of_week=excluded.days_of_week,local_date=excluded.local_date,absolute_at=excluded.absolute_at,anchor_at=excluded.anchor_at,offset_minutes=excluded.offset_minutes,next_run_at=excluded.next_run_at,updated_at=now();
  elsif kind in ('reminder.toggle','reminder.archive') then
   if r.id is null then raise exception 'Choose a reminder' using errcode='22023';end if;
   update public.reminders set enabled=case when kind='reminder.archive' then false else not enabled end,archived_at=case when kind='reminder.archive' then now() else archived_at end,version=version+1,updated_at=now() where reminders.id=r.id returning * into r;
   select * into s from public.reminder_schedules where reminder_id=r.id for update;source:=private.notification_source(r,now());schedule:=private.notification_schedule_json(s)||jsonb_build_object('anchorAt',source->>'anchorAt');
   update public.reminder_schedules set next_run_at=case when r.enabled and r.archived_at is null then private.notification_next(schedule,now()) end,anchor_at=(source->>'anchorAt')::timestamptz,updated_at=now() where reminder_id=r.id;
  else raise exception 'Unknown reminder action' using errcode='22023';end if;
  update public.notifications set resolved_at=now(),resolution_code=case when r.enabled then 'reminder_changed' else 'reminder_disabled' end where reminder_id=r.id and resolved_at is null and (not r.enabled or state='pending');
  update public.notification_deliveries d set status='cancelled',failure_code='reminder_changed',updated_at=now() from public.notifications x where x.id=d.notification_id and x.reminder_id=r.id and x.resolved_at is not null and d.status in ('pending','queued');
  result:=jsonb_build_object('id',r.id,'version',r.version,'enabled',r.enabled);
 elsif kind='notifications.bulk' then
  if jsonb_typeof(p_command->'ids')<>'array' or jsonb_array_length(p_command->'ids') not between 1 and 50 then raise exception 'Select up to 50 notifications' using errcode='22023';end if;
  select array_agg(distinct value::uuid) into ids from jsonb_array_elements_text(p_command->'ids');action:=p_command->>'action';
  if action not in ('read','unread','save','unsave','archive','restore') then raise exception 'Invalid inbox action' using errcode='22023';end if;
  if (select count(*) from public.notifications x where x.id=any(ids) and x.user_id=actor and public.is_workspace_member(x.workspace_id))<>cardinality(ids) then raise exception 'Notification selection is not authorized' using errcode='42501';end if;
  perform 1 from public.notifications where notifications.id=any(ids) order by notifications.id for update;
  update public.notifications x set read_at=case action when 'read' then coalesce(x.read_at,now()) when 'unread' then null else x.read_at end,saved_at=case action when 'save' then coalesce(x.saved_at,now()) when 'unsave' then null else x.saved_at end,
   state=case when action='archive' then 'archived' when action='restore' then case when x.available_at>now() then 'pending' when x.read_at is null then 'available' else 'read' end when action='read' and x.state='available' then 'read' when action='unread' and x.state='read' then 'available' else x.state end,
   archived_at=case action when 'archive' then now() when 'restore' then null else x.archived_at end where x.id=any(ids);
  result:=jsonb_build_object('updated',cardinality(ids));
 elsif kind in ('notification.open','notification.snooze') then
  select * into n from public.notifications where notifications.id=(p_command->>'id')::uuid and user_id=actor and public.is_workspace_member(workspace_id) for update;if n.id is null then raise exception 'Notification not found' using errcode='42501';end if;select * into w from public.workspaces where workspaces.id=n.workspace_id;
  source:=private.notification_current(n,now());
  if not(source->>'valid')::boolean then update public.notifications set resolved_at=coalesce(resolved_at,now()),resolution_code=source->>'code' where notifications.id=n.id;result:=jsonb_build_object('handled',true,'code',source->>'code');
  elsif kind='notification.open' then update public.notifications set read_at=coalesce(read_at,now()),state=case when state='available' then 'read' else state end where notifications.id=n.id;select slug into action from public.workspaces where workspaces.id=n.workspace_id;result:=jsonb_build_object('actionType',n.action_type,'sourceId',n.source_id,'workspaceSlug',action,'handled',false);
  else
   action:=p_command->>'choice';if action='later_today' then until_at:=now()+interval '2 hours';elsif action='tomorrow' then until_at:=(((now() at time zone w.timezone)::date+1)+time '09:00') at time zone w.timezone;elsif action='next_study_day' then for i in 1..14 loop if private.planning_capacity(n.workspace_id,(now() at time zone w.timezone)::date+i)>0 then until_at:=(((now() at time zone w.timezone)::date+i)+time '09:00') at time zone w.timezone;exit;end if;end loop;else until_at:=(p_command->>'until')::timestamptz;end if;
   if until_at is null or until_at<now()+interval '5 minutes' or until_at>now()+interval '30 days' then raise exception 'Snooze for 5 minutes to 30 days' using errcode='22023';end if;
   until_at:=private.notification_quiet_until(private.notification_preference(actor,n.workspace_id,n.category),until_at);
   if n.expires_at is not null and until_at>=n.expires_at then raise exception 'This item will no longer be relevant at that time' using errcode='22023';end if;
   update public.notifications set state='pending',read_at=null,snoozed_until=until_at,available_at=until_at where notifications.id=n.id;
   update public.notification_deliveries set scheduled_for=until_at where notification_id=n.id and status in ('pending','queued');update private.notification_outbox set scheduled_for=until_at where entity_id in(select d.id from public.notification_deliveries d where d.notification_id=n.id) and status='pending';
   result:=jsonb_build_object('originalOccurrence',n.scheduled_for,'snoozedUntil',until_at);
  end if;
 elsif kind in ('preference.save','preference.reset') then
  scope:=case when p_command->>'scope'='account' then null else w.id end;family:=p_command->>'family';
  if kind='preference.reset' then if scope is null then raise exception 'Reset applies to workspace overrides' using errcode='22023';end if;delete from public.notification_preferences where user_id=actor and workspace_id=scope and event_family=family;
  else
   if not private.notification_timezone(p_command->>'timezone') then raise exception 'Choose an IANA timezone' using errcode='22023';end if;
   if coalesce((p_command->>'email')::boolean,false) and not(select email_enabled from private.notification_runtime where notification_runtime.id) then raise exception 'Email delivery is not configured' using errcode='22023';end if;
   if coalesce((p_command->>'push')::boolean,false) and not(select push_enabled from private.notification_runtime where notification_runtime.id) then raise exception 'Browser push is not configured' using errcode='22023';end if;
   insert into public.notification_preferences(user_id,workspace_id,event_family,in_app_enabled,email_enabled,push_enabled,quiet_enabled,quiet_start,quiet_end,timezone,push_privacy)
   values(actor,scope,family,coalesce((p_command->>'inApp')::boolean,true),coalesce((p_command->>'email')::boolean,false),coalesce((p_command->>'push')::boolean,false),coalesce((p_command->>'quietEnabled')::boolean,true),coalesce((p_command->>'quietStart')::time,time '22:30'),coalesce((p_command->>'quietEnd')::time,time '07:00'),p_command->>'timezone',coalesce(p_command->>'pushPrivacy','private'))
   on conflict(user_id,workspace_id,event_family) do update set in_app_enabled=excluded.in_app_enabled,email_enabled=excluded.email_enabled,push_enabled=excluded.push_enabled,quiet_enabled=excluded.quiet_enabled,quiet_start=excluded.quiet_start,quiet_end=excluded.quiet_end,timezone=excluded.timezone,push_privacy=excluded.push_privacy,updated_at=now();
  end if;result:=jsonb_build_object('saved',true);
 elsif kind='report.request' then
  perform private.notification_access(p_slug,true);start_day:=date_trunc('week',now() at time zone w.timezone)::date-7;
  insert into public.weekly_reports(workspace_id,user_id,period_start,period_end,timezone) values(w.id,actor,start_day,start_day+6,w.timezone) on conflict(workspace_id,user_id,period_start,policy_version) do nothing returning weekly_reports.id into id;
  if id is null then select weekly_reports.id into id from public.weekly_reports where workspace_id=w.id and user_id=actor and period_start=start_day and policy_version='weekly-report-v1';end if;
  insert into private.notification_outbox(workspace_id,user_id,kind,entity_id,idempotency_key,scheduled_for) values(w.id,actor,'report',id,'report:'||id,now()) on conflict(idempotency_key) do nothing;result:=jsonb_build_object('reportId',id);
 elsif kind='report.generate' then
  result:=private.notification_report_run((p_command->>'id')::uuid,true);
 elsif kind='push.register' then
  if not(select push_enabled from private.notification_runtime where notification_runtime.id) then raise exception 'Browser push is not configured' using errcode='22023';end if;
  endpoint:=p_command->>'endpoint';if length(endpoint)>4096 or endpoint!~'^https://(fcm\.googleapis\.com|[a-z0-9-]+\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/' or coalesce(p_command->>'p256dh','')!~'^[A-Za-z0-9_-]{87}$' or coalesce(p_command->>'auth','')!~'^[A-Za-z0-9_-]{22}$' then raise exception 'Unsupported browser push subscription' using errcode='22023';end if;
  subscription_hash:=encode(sha256(convert_to(endpoint,'UTF8')),'hex');provider:=split_part(split_part(endpoint,'/',3),':',1);
  if (select count(*) from public.push_subscriptions where user_id=actor and revoked_at is null)>=5 and not exists(select 1 from public.push_subscriptions p where p.user_id=actor and p.endpoint_hash=subscription_hash) then raise exception 'Up to five active push devices are supported' using errcode='22023';end if;
  insert into public.push_subscriptions(user_id,endpoint_hash,provider,device_name) values(actor,subscription_hash,provider,coalesce(nullif(btrim(p_command->>'deviceName'),''),'This browser')) on conflict on constraint push_subscriptions_owner_endpoint do update set revoked_at=null,device_name=excluded.device_name returning push_subscriptions.id into id;
  insert into private.notification_push_credentials(subscription_id,user_id,endpoint,p256dh,auth) values(id,actor,endpoint,p_command->>'p256dh',p_command->>'auth') on conflict(subscription_id) do update set endpoint=excluded.endpoint,p256dh=excluded.p256dh,auth=excluded.auth;
  result:=jsonb_build_object('id',id);
 elsif kind='push.revoke' then
  update public.push_subscriptions set revoked_at=now() where push_subscriptions.id=(p_command->>'id')::uuid and user_id=actor returning push_subscriptions.id into id;if id is null then raise exception 'Push device not found' using errcode='42501';end if;delete from private.notification_push_credentials where subscription_id=id;result:=jsonb_build_object('revoked',true);
 else raise exception 'Unknown notification action' using errcode='22023';end if;
 insert into public.notification_actions(workspace_id,user_id,notification_id,reminder_id,event_type,request_id,request_hash,response) values(w.id,actor,case when n.workspace_id=w.id then n.id end,r.id,kind,p_request,hash,result);
 return result;
end $$;
alter table public.push_subscriptions enable row level security;alter table public.push_subscriptions force row level security;revoke all on public.push_subscriptions from public,anon,authenticated,service_role;grant select on public.push_subscriptions to authenticated;
create policy notification_push_owned_read on public.push_subscriptions for select to authenticated using(user_id=(select auth.uid()));
do $$declare t text;begin foreach t in array array['notification_push_credentials','notification_outbox','notification_runtime','notification_provider_events'] loop execute 'alter table private.'||t||' enable row level security';execute 'alter table private.'||t||' force row level security';execute 'revoke all on private.'||t||' from public,anon,authenticated,service_role';end loop;end $$;

create function private.notification_access(p_slug text,p_write boolean default false) returns public.workspaces language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;begin w:=private.revision_access(p_slug);if p_write and w.status<>'active' then raise exception 'Archived workspace reminders are read-only' using errcode='42501';end if;return w;end $$;
create function private.notification_service_access() returns void language plpgsql security definer set search_path='' as $$begin if current_setting('role',true)<>'service_role' then raise exception 'Notification service access required' using errcode='42501';end if;end $$;
create function private.notification_timezone(p_timezone text) returns boolean language sql stable set search_path='' as $$select p_timezone is not null and length(p_timezone)<=80 and exists(select 1 from pg_timezone_names where name=p_timezone) and (p_timezone='UTC' or strpos(p_timezone,'/')>0)$$;

-- One scheduling implementation: minute precision, wall-clock recurrence, later DST fold,
-- spring gaps shift forward by the transition. A local date/time is emitted at most once.
create function private.notification_next(p_schedule jsonb,p_after timestamptz) returns timestamptz language plpgsql stable set search_path='' as $$
declare tz text:=p_schedule->>'timezone';kind text:=p_schedule->>'scheduleType';d date;c timestamptz;i integer;days integer[];begin
 if not private.notification_timezone(tz) or kind not in ('once','daily','weekly','selected_days','event_relative') then raise exception 'Invalid reminder schedule or timezone' using errcode='22023';end if;
 if kind='event_relative' then if p_schedule->>'anchorAt' is null then return null;end if;c:=(p_schedule->>'anchorAt')::timestamptz+(p_schedule->>'offsetMinutes')::integer*interval '1 minute';return case when c>p_after then c end;end if;
 if kind='once' then c:=case when p_schedule->>'absoluteAt' is not null then (p_schedule->>'absoluteAt')::timestamptz else ((p_schedule->>'localDate')::date+(p_schedule->>'localTime')::time) at time zone tz end;return case when c>p_after then c end;end if;
 if p_schedule->>'localTime' is null then raise exception 'Choose a reminder time' using errcode='22023';end if;
 if kind in ('weekly','selected_days') then select array_agg(value::integer) into days from jsonb_array_elements_text(p_schedule->'daysOfWeek');if cardinality(days) not between 1 and 7 or not days<@array[0,1,2,3,4,5,6] or kind='weekly' and cardinality(days)<>1 then raise exception 'Choose valid weekdays' using errcode='22023';end if;end if;
 for i in 0..14 loop d:=(p_after at time zone tz)::date+i;if kind='daily' or extract(dow from d)::integer=any(days) then c:=(d+(p_schedule->>'localTime')::time) at time zone tz;if c>p_after then return c;end if;end if;end loop;raise exception 'No valid next occurrence' using errcode='22023';
end $$;
create function private.notification_schedule_json(s public.reminder_schedules) returns jsonb language sql immutable set search_path='' as $$select jsonb_build_object('scheduleType',s.schedule_type,'timezone',s.timezone,'localTime',s.local_time,'daysOfWeek',s.days_of_week,'localDate',s.local_date,'absoluteAt',s.absolute_at,'anchorAt',s.anchor_at,'offsetMinutes',s.offset_minutes)$$;
create function private.notification_preference(p_user uuid,p_workspace uuid,p_family text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare f public.notification_preferences%rowtype;q public.notification_preferences%rowtype;tz text;begin
 select * into f from public.notification_preferences where user_id=p_user and (workspace_id=p_workspace or workspace_id is null) and event_family in (p_family,'*') order by (workspace_id is not null) desc,(event_family=p_family) desc limit 1;
 select * into q from public.notification_preferences where user_id=p_user and (workspace_id=p_workspace or workspace_id is null) and event_family='*' order by (workspace_id is not null) desc limit 1;
 select timezone into tz from public.workspaces where id=p_workspace;
 return jsonb_build_object('inApp',coalesce(f.in_app_enabled,true),'email',coalesce(f.email_enabled,false),'push',coalesce(f.push_enabled,false),'quietEnabled',coalesce(q.quiet_enabled,true),'quietStart',coalesce(q.quiet_start,time '22:30'),'quietEnd',coalesce(q.quiet_end,time '07:00'),'timezone',coalesce(q.timezone,tz,'UTC'),'pushPrivacy',coalesce(q.push_privacy,'private'));
end $$;
create function private.notification_quiet_until(p_preferences jsonb,p_at timestamptz) returns timestamptz language plpgsql stable set search_path='' as $$
declare tz text:=p_preferences->>'timezone';a time:=(p_preferences->>'quietStart')::time;b time:=(p_preferences->>'quietEnd')::time;local_at timestamp:=p_at at time zone tz;finish date;begin
 if not coalesce((p_preferences->>'quietEnabled')::boolean,false) then return p_at;end if;
 if a=b then raise exception 'Quiet hours must have different start and end times' using errcode='22023';end if;
 if a<b then if local_at::time>=a and local_at::time<b then return (local_at::date+b) at time zone tz;end if;
 elsif local_at::time>=a or local_at::time<b then finish:=local_at::date+case when local_at::time>=a then 1 else 0 end;return (finish+b) at time zone tz;end if;return p_at;
end $$;

create function private.notification_inbox(p_slug text,p_filters jsonb default '{}',p_cursor jsonb default null,p_limit integer default 30) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare w public.workspaces%rowtype;actor uuid:=(select auth.uid());scope uuid;view text:=coalesce(p_filters->>'view','all');filter_category text:=coalesce(p_filters->>'category','all');days integer;query text:=btrim(coalesce(p_filters->>'search',''));result jsonb;begin
 w:=private.notification_access(p_slug);
 if p_limit is null or p_limit not between 1 and 30 or view not in ('all','unread','saved','archive','snoozed') or filter_category not in ('all','plan','revision','practice','interview','application','report','workspace','system','custom') or length(query)>120 or octet_length(p_filters::text)>4000 or octet_length(coalesce(p_cursor,'{}')::text)>1000 then raise exception 'Invalid inbox filters' using errcode='22023';end if;
 scope:=case when p_filters->>'workspace'='all' then null when coalesce(p_filters->>'workspace','current')='current' then w.id else (p_filters->>'workspace')::uuid end;if scope is not null and not public.is_workspace_member(scope) then raise exception 'Workspace filter is not authorized' using errcode='42501';end if;
 days:=case coalesce(p_filters->>'range','30d') when '7d' then 7 when '30d' then 30 when '90d' then 90 when 'all' then null else -1 end;if days=-1 then raise exception 'Invalid inbox date range' using errcode='22023';end if;
 with base as not materialized(
  select n.id,n.workspace_id,n.user_id,n.category,n.event_type,n.title,n.body,n.reason,n.context,n.source_type,n.source_id,n.action_type,n.priority,n.state,n.scheduled_for,n.available_at,n.read_at,n.saved_at,n.archived_at,n.resolved_at,n.resolution_code,n.snoozed_until,n.created_at,n.report_id,ws.slug,ws.name,ws.timezone
  from public.notifications n join public.workspaces ws on ws.id=n.workspace_id where n.user_id=actor and ws.status in ('active','archived') and public.is_workspace_member(n.workspace_id) and (scope is null or n.workspace_id=scope) and (days is null or n.created_at>=now()-make_interval(days=>days)) and (filter_category='all' or n.category=filter_category) and (query='' or strpos(lower(n.title||' '||n.body||' '||ws.name||' '||n.category),lower(query))>0)
  and exists(select 1 from public.notification_deliveries d where d.notification_id=n.id and d.channel='in_app' and d.status in ('delivered','pending'))
 ),selected as materialized(select b.* from base b where(case view when 'archive' then b.state='archived' when 'snoozed' then b.state='pending' and b.snoozed_until>now() when 'unread' then b.state='available' and b.read_at is null when 'saved' then b.state in ('available','read') and b.saved_at is not null else b.state in ('available','read') end) and (p_cursor->>'at' is null or (b.created_at,b.id)<((p_cursor->>'at')::timestamptz,(p_cursor->>'id')::uuid)) order by b.created_at desc,b.id desc limit p_limit+1),
 counts as(select
  (select count(*) from(select id from base where state in ('available','read') limit 501)x) all_count,
  (select count(*) from(select id from base where state='available' and read_at is null limit 501)x) unread_count,
  (select count(*) from(select id from base where state in ('available','read') and saved_at is not null limit 501)x) saved_count,
  (select count(*) from(select id from base where state='archived' limit 501)x) archived_count,
  (select count(*) from(select id from base where state='pending' and snoozed_until>now() limit 501)x) snoozed_count)
 select jsonb_build_object('context',jsonb_build_object('workspace',jsonb_build_object('id',w.id,'slug',w.slug,'name',w.name,'timezone',w.timezone,'userId',actor,'canEdit',w.status='active'),'asOf',now(),'policyVersion','notification-policy-v1'),
 'items',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'workspace',jsonb_build_object('id',x.workspace_id,'slug',x.slug,'name',x.name,'timezone',x.timezone),'category',x.category,'eventType',x.event_type,'title',x.title,'body',x.body,'reason',x.reason,'context',x.context,'sourceType',x.source_type,'sourceId',x.source_id,'actionType',x.action_type,'priority',x.priority,'state',x.state,'scheduledFor',x.scheduled_for,'availableAt',x.available_at,'readAt',x.read_at,'savedAt',x.saved_at,'archivedAt',x.archived_at,'resolvedAt',x.resolved_at,'resolutionCode',x.resolution_code,'snoozedUntil',x.snoozed_until,'createdAt',x.created_at,'reportId',x.report_id) order by x.created_at desc,x.id desc) from(select * from selected order by created_at desc,id desc limit p_limit)x),'[]'),
 'counts',(select jsonb_build_object('all',all_count,'unread',unread_count,'saved',saved_count,'archive',archived_count,'snoozed',snoozed_count,'bounded',true,'limit',500) from counts),
 'cursor',case when (select count(*) from selected)>p_limit then(select jsonb_build_object('at',created_at,'id',id) from selected order by created_at desc,id desc offset p_limit-1 limit 1) end,
 'attention',(select jsonb_build_object('items',count(*),'revisionItems',coalesce(sum((context->>'count')::integer) filter(where category='revision'),0)) from(select category,context from base where state='available' and resolved_at is null and priority='important' order by created_at desc limit 100)x)) into result;return result;
end $$;

create function private.notification_settings(p_slug text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare w public.workspaces%rowtype;actor uuid:=(select auth.uid());begin w:=private.notification_access(p_slug);
 return jsonb_build_object('workspace',jsonb_build_object('id',w.id,'slug',w.slug,'name',w.name,'timezone',w.timezone,'userId',actor,'canEdit',w.status='active'),
 'reminders',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'type',r.type,'title',r.title,'body',r.body,'sourceType',r.source_type,'sourceId',r.source_id,'priority',r.priority,'channels',r.channels,'enabled',r.enabled,'respectQuietHours',r.respect_quiet_hours,'version',r.version,'archivedAt',r.archived_at,'schedule',private.notification_schedule_json(s),'nextRunAt',s.next_run_at,'lastRunAt',s.last_run_at) order by r.created_at) from public.reminders r join public.reminder_schedules s on s.reminder_id=r.id where r.workspace_id=w.id and r.user_id=actor),'[]'),
 'preferences',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'scope',case when p.workspace_id is null then 'account' else 'workspace' end,'family',p.event_family,'inApp',p.in_app_enabled,'email',p.email_enabled,'push',p.push_enabled,'quietEnabled',p.quiet_enabled,'quietStart',p.quiet_start,'quietEnd',p.quiet_end,'timezone',p.timezone,'pushPrivacy',p.push_privacy)) from public.notification_preferences p where p.user_id=actor and (p.workspace_id is null or p.workspace_id=w.id)),'[]'),
 'effective',private.notification_preference(actor,w.id,'*'),
 'devices',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'provider',p.provider,'name',p.device_name,'createdAt',p.created_at,'lastUsedAt',p.last_used_at,'revokedAt',p.revoked_at) order by p.created_at desc) from public.push_subscriptions p where p.user_id=actor),'[]'),
 'workspaces',(select jsonb_agg(jsonb_build_object('id',ws.id,'slug',ws.slug,'name',ws.name,'timezone',ws.timezone,'status',ws.status) order by ws.name) from public.workspaces ws where public.is_workspace_member(ws.id) and ws.status in ('active','archived')),
 'relatedTasks',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'title',t.title,'at',t.scheduled_start,'type',t.task_type) order by t.scheduled_start) from(select x.id,x.title,x.scheduled_start,x.task_type from public.daily_tasks x where x.workspace_id=w.id and x.scheduled_start>now() and x.status in ('planned','in_progress') order by x.scheduled_start limit 50)t),'[]'),
 'targetAvailable',exists(select 1 from public.workspace_targets where workspace_id=w.id and target_date>=(now() at time zone w.timezone)::date),
 'reports',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'periodStart',x.period_start,'periodEnd',x.period_end,'timezone',x.timezone,'status',x.status,'generatedAt',x.generated_at,'failureCode',x.failure_code,'attemptCount',x.attempt_count) order by x.period_start desc) from(select id,period_start,period_end,timezone,status,generated_at,failure_code,attempt_count from public.weekly_reports where workspace_id=w.id and user_id=actor order by period_start desc limit 12)x),'[]'),
 'capabilities',(select jsonb_build_object('inApp',true,'background',dispatcher_enabled and last_success_at>now()-interval '5 minutes','email',email_enabled,'push',push_enabled,'pushPublicKey',push_public_key,'interviewTracking',false,'applications',false) from private.notification_runtime where id));
end $$;

create function private.notification_detail(p_slug text,p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare w public.workspaces%rowtype;n public.notifications%rowtype;source jsonb;begin w:=private.notification_access(p_slug);select * into n from public.notifications where id=p_id and user_id=(select auth.uid()) and public.is_workspace_member(workspace_id);if n.id is null then raise exception 'Notification not found' using errcode='42501';end if;source:=private.notification_current(n,now());
 return jsonb_build_object('id',n.id,'currentSource',source,'deliveries',coalesce((select jsonb_agg(jsonb_build_object('channel',d.channel,'status',d.status,'providerStatus',d.provider_status,'scheduledFor',d.scheduled_for,'deliveredAt',d.delivered_at,'failureCode',d.failure_code) order by d.channel) from public.notification_deliveries d where d.notification_id=n.id),'[]'),'report',case when n.report_id is not null then(select jsonb_build_object('id',r.id,'status',r.status,'snapshot',r.summary_json) from public.weekly_reports r where r.id=n.report_id) end);
end $$;
create function private.notification_report(p_slug text,p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$declare w public.workspaces%rowtype;result jsonb;begin w:=private.notification_access(p_slug);select jsonb_build_object('id',id,'periodStart',period_start,'periodEnd',period_end,'timezone',timezone,'status',status,'generatedAt',generated_at,'failureCode',failure_code,'attemptCount',attempt_count,'snapshot',summary_json) into result from public.weekly_reports where id=p_id and user_id=(select auth.uid()) and workspace_id=w.id;if result is null then raise exception 'Report not found' using errcode='42501';end if;return result;end $$;

create function private.notification_schedule_preview(p_slug text,p_schedule jsonb,p_source_type text default 'workspace',p_source_id uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare w public.workspaces%rowtype;anchor timestamptz;s jsonb;next_at timestamptz;begin w:=private.notification_access(p_slug);
 if octet_length(p_schedule::text)>2000 then raise exception 'Invalid schedule' using errcode='22023';end if;
 if p_source_type='task' then select scheduled_start into anchor from public.daily_tasks where id=p_source_id and workspace_id=w.id and status in ('planned','in_progress');if anchor is null then raise exception 'Choose a scheduled task in this workspace' using errcode='22023';end if;
 elsif p_source_type='target' then if p_source_id is distinct from w.id then raise exception 'Source scope denied' using errcode='42501';end if;select (target_date+time '09:00') at time zone w.timezone into anchor from public.workspace_targets where workspace_id=w.id;
 elsif p_source_type not in ('workspace','custom') then raise exception 'Unsupported reminder source' using errcode='22023';end if;
 s:=p_schedule||jsonb_build_object('anchorAt',anchor);next_at:=private.notification_next(s,now());return jsonb_build_object('nextRunAt',next_at,'timezone',s->>'timezone','policyVersion','reminder-schedule-v1','dstPolicy','Spring gaps shift forward; fall folds use one later occurrence.','reportPeriod','Last complete Monday–Sunday in the workspace timezone.');
end $$;

-- Source changes update future relative schedules and invalidate outstanding actions.
create function private.notification_source_changed() returns trigger language plpgsql security definer set search_path='' as $$
declare r public.reminders%rowtype;s public.reminder_schedules%rowtype;source jsonb;scope uuid;changed_source_id uuid;begin
 scope:=new.workspace_id;if tg_table_name='daily_tasks' then changed_source_id:=new.id;else changed_source_id:=new.workspace_id;end if;
 for r in select * from public.reminders where workspace_id=scope and reminders.source_id=changed_source_id and archived_at is null order by id for no key update loop
  select * into s from public.reminder_schedules where reminder_id=r.id for update;source:=private.notification_source(r,now());
  if s.schedule_type='event_relative' then update public.reminder_schedules set anchor_at=(source->>'anchorAt')::timestamptz,next_run_at=case when r.enabled and (source->>'valid')::boolean then private.notification_next(private.notification_schedule_json(s)||jsonb_build_object('anchorAt',source->'anchorAt'),now()) end,updated_at=now() where id=s.id;end if;
  update public.notifications set resolved_at=now(),resolution_code='source_changed' where reminder_id=r.id and resolved_at is null and state<>'archived';
  update public.notification_deliveries set status='cancelled',failure_code='source_changed',updated_at=now() where notification_id in(select id from public.notifications where reminder_id=r.id and resolution_code='source_changed') and status in ('pending','queued');
 end loop;return new;
end $$;
create trigger notification_task_changed after update of scheduled_start,status on public.daily_tasks for each row when(old.scheduled_start is distinct from new.scheduled_start or old.status is distinct from new.status) execute function private.notification_source_changed();
create trigger notification_target_changed after update of target_date on public.workspace_targets for each row when(old.target_date is distinct from new.target_date) execute function private.notification_source_changed();
create function private.notification_report_immutable() returns trigger language plpgsql set search_path='' as $$begin if old.status='ready' and new is distinct from old then raise exception 'Published weekly reports are immutable' using errcode='22023';end if;return new;end $$;
create trigger notification_report_frozen before update on public.weekly_reports for each row execute function private.notification_report_immutable();

create function private.notification_check(p_slug text) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;n public.notifications%rowtype;source jsonb;begin w:=private.notification_access(p_slug);
 for n in select * from public.notifications where user_id=(select auth.uid()) and workspace_id=w.id and state in ('available','read') and resolved_at is null order by created_at desc limit 100 for update skip locked loop
  source:=private.notification_current(n,now());if not(source->>'valid')::boolean then update public.notifications set resolved_at=now(),resolution_code=source->>'code' where id=n.id;end if;
 end loop;return private.notification_dispatch((select auth.uid()),w.id,10);
end $$;

-- Worker API: leases are unguessable capabilities; only the service role may enter.
create function private.notification_worker(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare kind text:=p_command->>'kind';o private.notification_outbox%rowtype;d public.notification_deliveries%rowtype;n public.notifications%rowtype;pref jsonb;source jsonb;result jsonb:='[]';token uuid;until_at timestamptz;payload jsonb;email text;begin
 perform private.notification_service_access();
 if p_command is null or octet_length(p_command::text)>16000 then raise exception 'Invalid worker request' using errcode='22023';end if;
 if kind='dispatch' then return private.notification_dispatch(null,null,25);
 elsif kind='heartbeat' then
  update private.notification_runtime set dispatcher_enabled=true,email_enabled=coalesce((p_command->>'email')::boolean,false),push_enabled=coalesce((p_command->>'push')::boolean,false),push_public_key=case when coalesce((p_command->>'push')::boolean,false) then p_command->>'pushPublicKey' end,last_success_at=now(),last_failure_code=null where id;return '{"ok":true}';
 elsif kind='outbox.claim' then
  update private.notification_outbox set status='failed',last_failure_code='publication_exhausted',lease_until=null where id in(select x.id from private.notification_outbox x where x.publish_attempts>=12 and x.status in ('pending','publishing') and (x.lease_until is null or x.lease_until<now()) order by x.scheduled_for limit 100 for update skip locked);
  for o in select * from private.notification_outbox where scheduled_for<=now() and (status='pending' or status='publishing' and lease_until<now()) and publish_attempts<12 order by scheduled_for,id limit 25 for update skip locked loop
   token:=gen_random_uuid();update private.notification_outbox set status='publishing',lease_token=token,lease_until=now()+interval '2 minutes',publish_attempts=publish_attempts+1 where id=o.id;
   result:=result||jsonb_build_array(jsonb_build_object('id',o.id,'kind',o.kind,'entityId',o.entity_id,'workspaceId',o.workspace_id,'userId',o.user_id,'idempotencyKey',o.idempotency_key,'leaseToken',token,'createdAt',o.created_at));
  end loop;return result;
 elsif kind='outbox.ack' then
  update private.notification_outbox set status='published',published_at=now(),lease_until=null where id=(p_command->>'id')::uuid and lease_token=(p_command->>'leaseToken')::uuid and status='publishing';return jsonb_build_object('acknowledged',found);
 elsif kind='report.run' then return private.notification_report_run((p_command->>'id')::uuid);
 elsif kind='delivery.claim' then
  select * into d from public.notification_deliveries where id=(p_command->>'id')::uuid for update skip locked;
  if d.id is null or d.status in ('delivered','failed','suppressed','cancelled') then return jsonb_build_object('state','done');end if;
  if d.status='processing' and d.lease_until>now() then return jsonb_build_object('state','wait','delay',120);end if;
  if d.scheduled_for>now() then return jsonb_build_object('state','wait','delay',least(43200,greatest(1,ceil(extract(epoch from d.scheduled_for-now())))));end if;
  select * into n from public.notifications where id=d.notification_id;source:=private.notification_current(n,now());pref:=private.notification_preference(d.user_id,d.workspace_id,n.category);
  if not(source->>'valid')::boolean or not coalesce((pref->>d.channel)::boolean,false) then update public.notification_deliveries set status='suppressed',failure_code=case when not(source->>'valid')::boolean then source->>'code' else 'channel_disabled' end where id=d.id;return jsonb_build_object('state','done');end if;
  until_at:=case when coalesce((select respect_quiet_hours from public.reminders where id=n.reminder_id),true) then private.notification_quiet_until(pref,now()) else now() end;
  if until_at>now() then update public.notification_deliveries set scheduled_for=until_at,status='queued',lease_until=null where id=d.id;return jsonb_build_object('state','wait','delay',least(43200,ceil(extract(epoch from until_at-now()))));end if;
  if d.attempt_count>=6 or d.first_attempt_at<now()-interval '23 hours' then update public.notification_deliveries set status='failed',failure_code='retry_window_ended',failed_at=now() where id=d.id;return jsonb_build_object('state','done');end if;
  if d.channel='email' and not(select email_enabled from private.notification_runtime where id) or d.channel='push' and not(select push_enabled from private.notification_runtime where id) then update public.notification_deliveries set status='suppressed',failure_code='provider_unconfigured' where id=d.id;return jsonb_build_object('state','done');end if;
  if d.channel='email' then select u.email into email from auth.users u where u.id=d.user_id and u.email_confirmed_at is not null;if email is null then update public.notification_deliveries set status='suppressed',failure_code='email_unverified' where id=d.id;return jsonb_build_object('state','done');end if;end if;
  token:=gen_random_uuid();payload:=coalesce(d.render_snapshot,jsonb_build_object('title',n.title,'body',n.body,'workspaceSlug',(select slug from public.workspaces where id=n.workspace_id),'actionType',n.action_type,'sourceId',n.source_id,'reportId',n.report_id,'notificationId',n.id,'private',pref->>'pushPrivacy'='private','expiresAt',n.expires_at));
  update public.notification_deliveries set status='processing',attempt_count=attempt_count+1,first_attempt_at=coalesce(first_attempt_at,now()),last_attempt_at=now(),lease_token=token,lease_until=now()+interval '2 minutes',render_snapshot=payload where id=d.id;
  return jsonb_build_object('state','claimed','id',d.id,'channel',d.channel,'leaseToken',token,'attempt',d.attempt_count+1,'idempotencyKey',d.idempotency_key,'email',email,'payload',payload,'subscriptions',case when d.channel='push' then coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'endpoint',c.endpoint,'keys',jsonb_build_object('p256dh',c.p256dh,'auth',c.auth))) from public.push_subscriptions s join private.notification_push_credentials c on c.subscription_id=s.id where s.user_id=d.user_id and s.revoked_at is null),'[]') end);
 elsif kind='delivery.defer' then
  update private.notification_outbox set status='pending',scheduled_for=now()+make_interval(secs=>least(43200,greatest(1,(p_command->>'delay')::integer))),lease_token=null,lease_until=null,publish_attempts=0 where notification_outbox.kind='delivery' and entity_id=(p_command->>'id')::uuid;return '{"ok":true}';
 elsif kind='delivery.finish' then
  select * into d from public.notification_deliveries where id=(p_command->>'id')::uuid and lease_token=(p_command->>'leaseToken')::uuid and status='processing' for update;
  if d.id is null then return '{"stale":true}';end if;
  if p_command->>'status' not in ('delivered','retry','failed','suppressed') or coalesce(p_command->>'code','')!~'^[a-z0-9_]{0,80}$' then raise exception 'Invalid delivery completion' using errcode='22023';end if;
  update public.notification_deliveries set status=case when p_command->>'status'='retry' then 'queued' else p_command->>'status' end,provider_message_id=left(p_command->>'providerId',160),provider_status=case when p_command->>'status'='delivered' then 'accepted' else provider_status end,delivered_at=case when p_command->>'status'='delivered' then now() end,failed_at=case when p_command->>'status'='failed' then now() end,failure_code=p_command->>'code',lease_until=null,updated_at=now() where id=d.id;return '{"ok":true}';
 elsif kind='push.accepted' then
  update public.notification_deliveries set render_snapshot=jsonb_set(render_snapshot,'{pushAccepted}',coalesce(render_snapshot->'pushAccepted','[]')||jsonb_build_array(p_command->>'subscriptionId')) where id=(p_command->>'id')::uuid and lease_token=(p_command->>'leaseToken')::uuid and status='processing';return jsonb_build_object('saved',found);
 elsif kind='push.expired' then
  select * into d from public.notification_deliveries where id=(p_command->>'deliveryId')::uuid and lease_token=(p_command->>'leaseToken')::uuid and status='processing';if d.id is null then raise exception 'Invalid delivery lease' using errcode='42501';end if;
  update public.push_subscriptions set revoked_at=now() where id=(p_command->>'id')::uuid and user_id=d.user_id;delete from private.notification_push_credentials where subscription_id=(p_command->>'id')::uuid and user_id=d.user_id;return '{"ok":true}';
 elsif kind='dead_letter' then
  if p_command->>'entityType'='delivery' then update public.notification_deliveries set status='failed',failed_at=now(),failure_code='queue_exhausted',lease_until=null where id=(p_command->>'id')::uuid and status in ('pending','queued','processing');else update public.weekly_reports set status='failed',failure_code='queue_exhausted' where id=(p_command->>'id')::uuid and status<>'ready';end if;return '{"ok":true}';
 elsif kind='ops.stats' then
  return jsonb_build_object('runtime',(select jsonb_build_object('dispatcherEnabled',dispatcher_enabled,'lastDispatchAt',last_dispatch_at,'lastSuccessAt',last_success_at,'emailConfigured',email_enabled,'pushConfigured',push_enabled) from private.notification_runtime where id),'outbox',(select jsonb_object_agg(status,n) from(select status,count(*) n from private.notification_outbox group by status)x),'deliveries',(select jsonb_object_agg(status,n) from(select status,count(*) n from public.notification_deliveries group by status)x),'reports',(select jsonb_object_agg(status,n) from(select status,count(*) n from public.weekly_reports group by status)x),'oldestDueSeconds',(select greatest(0,extract(epoch from now()-min(scheduled_for))) from private.notification_outbox where status='pending' and scheduled_for<=now()));
 elsif kind='provider.event' then
  if p_command->>'eventType' not in ('email.delivered','email.bounced','email.complained','email.delivery_delayed') then return '{"ignored":true}';end if;
  insert into private.notification_provider_events(provider,event_id,delivery_id,event_type) select 'resend',left(p_command->>'eventId',160),id,p_command->>'eventType' from public.notification_deliveries where provider='resend' and provider_message_id=p_command->>'providerId' on conflict do nothing;
  if found then update public.notification_deliveries set provider_status=p_command->>'eventType' where provider='resend' and provider_message_id=p_command->>'providerId';end if;return '{"ok":true}';
 else raise exception 'Unknown worker operation' using errcode='22023';end if;
end $$;

create function public.notification_inbox(p_slug text,p_filters jsonb default '{}',p_cursor jsonb default null,p_limit integer default 30) returns jsonb language sql security invoker set search_path='' as $$select private.notification_inbox(p_slug,p_filters,p_cursor,p_limit)$$;
create function public.notification_settings(p_slug text) returns jsonb language sql security invoker set search_path='' as $$select private.notification_settings(p_slug)$$;
create function public.notification_detail(p_slug text,p_id uuid) returns jsonb language sql security invoker set search_path='' as $$select private.notification_detail(p_slug,p_id)$$;
create function public.notification_report(p_slug text,p_id uuid) returns jsonb language sql security invoker set search_path='' as $$select private.notification_report(p_slug,p_id)$$;
create function public.notification_schedule_preview(p_slug text,p_schedule jsonb,p_source_type text default 'workspace',p_source_id uuid default null) returns jsonb language sql security invoker set search_path='' as $$select private.notification_schedule_preview(p_slug,p_schedule,p_source_type,p_source_id)$$;
create function public.notification_check(p_slug text) returns jsonb language sql security invoker set search_path='' as $$select private.notification_check(p_slug)$$;
create function public.notification_command(p_slug text,p_request uuid,p_command jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.notification_command(p_slug,p_request,p_command)$$;
create function public.notification_worker(p_command jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.notification_worker(p_command)$$;
do $$declare f record;begin
 for f in select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('private','public') and p.proname like 'notification_%' loop
  execute format('revoke all on function %I.%I(%s) from public,anon,authenticated,service_role',f.nspname,f.proname,f.args);
  if f.proname='notification_worker' then execute format('grant execute on function %I.%I(%s) to service_role',f.nspname,f.proname,f.args);
  elsif f.proname in ('notification_inbox','notification_settings','notification_detail','notification_report','notification_schedule_preview','notification_check','notification_command') then execute format('grant execute on function %I.%I(%s) to authenticated',f.nspname,f.proname,f.args);end if;
 end loop;
end $$;
grant usage on schema private to authenticated,service_role;
do $$begin if exists(select 1 from pg_publication where pubname='supabase_realtime') then alter publication supabase_realtime add table public.notifications;end if;end $$;

-- A scoped internal override preserves a report timezone without changing workspace settings.
create or replace function private.analytics_context(p_slug text,p_filters jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;today date;first_day date;last_day date;span integer;r text:=coalesce(p_filters->>'range','30d');g text:=coalesce(p_filters->>'granularity','auto');begin
 w:=private.revision_access(p_slug);if current_setting('prepcraft.report_scope',true)=w.id::text||':'||(select auth.uid())::text and private.notification_timezone(current_setting('prepcraft.report_timezone',true)) then w.timezone:=current_setting('prepcraft.report_timezone',true);end if;today:=(now() at time zone w.timezone)::date;
 if p_filters is null or jsonb_typeof(p_filters)<>'object' or octet_length(p_filters::text)>4000 then raise exception 'Invalid analytics filters' using errcode='22023';end if;
 if r not in ('7d','30d','90d','month','custom') or g not in ('auto','day','week','month') or coalesce(p_filters->>'difficulty','all') not in ('all','easy','medium','hard','unspecified') or coalesce(p_filters->>'mode','all') not in ('all','practice','interview','oa') or coalesce(p_filters->>'questionType','all') not in ('all','coding','objective','behavioral') or coalesce(p_filters->>'sessionType','all') not in ('all','initial','revision','mock') or coalesce(p_filters->>'cohort','coding') not in ('coding','objective','behavioral') then raise exception 'Unsupported analytics filters' using errcode='22023';end if;
 if length(coalesce(p_filters->>'track','all'))>200 or length(coalesce(p_filters->>'topic','all'))>200 or coalesce(p_filters->>'track','all')!~'^[a-z0-9][a-z0-9-]*$' or coalesce(p_filters->>'topic','all')!~'^[a-z0-9][a-z0-9-]*$' then raise exception 'Invalid analytics scope' using errcode='22023';end if;
 if r='custom' then first_day:=(p_filters->>'from')::date;last_day:=(p_filters->>'to')::date;
 else last_day:=case when r='month' and extract(day from today)=1 then today else today-1 end;first_day:=case r when '7d' then last_day-6 when '90d' then last_day-89 when 'month' then date_trunc('month',today)::date else last_day-29 end;end if;
 span:=last_day-first_day+1;if first_day is null or last_day is null or span not between 1 and 366 or last_day>today or first_day<date '2000-01-01' then raise exception 'Choose a past or current range of 1 to 366 days' using errcode='22023';end if;
 if g='auto' then g:=case when span<=14 then 'day' when span<=120 then 'week' else 'month' end;end if;
 if g='day' and span>90 then g:='week';end if;
 return jsonb_build_object('workspace',jsonb_build_object('id',w.id,'slug',w.slug,'name',w.name,'userId',(select auth.uid()),'timezone',w.timezone,'canEdit',w.status='active'),'from',first_day,'to',last_day,'fromAt',first_day::timestamp at time zone w.timezone,'toAt',least((last_day+1)::timestamp at time zone w.timezone,now()),'previousFrom',first_day-span,'previousTo',first_day-1,'previousFromAt',(first_day-span)::timestamp at time zone w.timezone,'days',span,'partial',last_day=today,'granularity',g,'asOf',now(),'policyVersion','analytics-policy-v1','timingPolicyVersion','timing-analytics-v1','filters',p_filters);
end $$;


create function private.notification_publish_report(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare job public.weekly_reports%rowtype;r public.reminders%rowtype;n uuid;begin
 select * into job from public.weekly_reports where id=p_id and status='ready';if job.id is null then return;end if;
 if current_setting('role',true)<>'service_role' and job.user_id is distinct from (select auth.uid()) then raise exception 'Report publication denied' using errcode='42501';end if;
 for r in select rm.* from public.reminders rm join public.reminder_occurrences o on o.reminder_id=rm.id where o.report_id=job.id and o.status='awaiting_report' and rm.enabled and rm.archived_at is null loop
  n:=private.notification_emit(r,'report:'||job.id,now(),jsonb_build_object('category','report','title','Your weekly preparation report is ready.','body','A snapshot of your recorded preparation, with clear next steps.','reason','Your enabled weekly report covers the last complete Monday–Sunday in its saved timezone. Missing sources remain visible.','action','view_report'),job.id);
  update public.reminder_occurrences set status='generated',notification_id=n where report_id=job.id and reminder_id=r.id;
 end loop;
end $$;
revoke all on function private.notification_publish_report(uuid) from public,anon,authenticated,service_role;
