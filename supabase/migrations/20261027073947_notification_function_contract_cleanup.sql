-- Follow-up to live plpgsql_check: explicit JSON types, lock-aware volatility, and unambiguous operator aggregates.
create or replace function private.notification_access(p_slug text,p_write boolean default false) returns public.workspaces language plpgsql security definer set search_path='' as $$
declare w public.workspaces%rowtype;begin w:=private.revision_access(p_slug,p_write);if p_write and w.status<>'active' then raise exception 'Archived workspace reminders are read-only' using errcode='42501';end if;return w;end $$;

create or replace function private.notification_command(p_slug text,p_request uuid,p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare w public.workspaces%rowtype;actor uuid:=(select auth.uid());r public.reminders%rowtype;s public.reminder_schedules%rowtype;n public.notifications%rowtype;prior public.notification_actions%rowtype;result jsonb:='{}'::jsonb;schedule jsonb;source jsonb;kind text:=p_command->>'kind';hash text:=md5(p_command::text);id uuid;ids uuid[];action text;delivery_channels text[];scope uuid;family text;next_at timestamptz;until_at timestamptz;start_day date;endpoint text;subscription_hash text;provider text;begin
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

create or replace function private.notification_next(p_schedule jsonb,p_after timestamptz) returns timestamptz language plpgsql stable set search_path='' as $$
declare tz text:=p_schedule->>'timezone';kind text:=p_schedule->>'scheduleType';d date;c timestamptz;days integer[];begin
 if not private.notification_timezone(tz) or kind not in ('once','daily','weekly','selected_days','event_relative') then raise exception 'Invalid reminder schedule or timezone' using errcode='22023';end if;
 if kind='event_relative' then if p_schedule->>'anchorAt' is null then return null;end if;c:=(p_schedule->>'anchorAt')::timestamptz+(p_schedule->>'offsetMinutes')::integer*interval '1 minute';return case when c>p_after then c end;end if;
 if kind='once' then c:=case when p_schedule->>'absoluteAt' is not null then (p_schedule->>'absoluteAt')::timestamptz else ((p_schedule->>'localDate')::date+(p_schedule->>'localTime')::time) at time zone tz end;return case when c>p_after then c end;end if;
 if p_schedule->>'localTime' is null then raise exception 'Choose a reminder time' using errcode='22023';end if;
 if kind in ('weekly','selected_days') then select array_agg(value::integer) into days from jsonb_array_elements_text(p_schedule->'daysOfWeek');if cardinality(days) not between 1 and 7 or not days<@array[0,1,2,3,4,5,6] or kind='weekly' and cardinality(days)<>1 then raise exception 'Choose valid weekdays' using errcode='22023';end if;end if;
 for i in 0..14 loop d:=(p_after at time zone tz)::date+i;if kind='daily' or extract(dow from d)::integer=any(days) then c:=(d+(p_schedule->>'localTime')::time) at time zone tz;if c>p_after then return c;end if;end if;end loop;raise exception 'No valid next occurrence' using errcode='22023';
end $$;

create or replace function private.notification_report_run(p_report uuid,p_own boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare job public.weekly_reports%rowtype;w public.workspaces%rowtype;r public.reminders%rowtype;filters jsonb;core jsonb;activity jsonb;interviews jsonb;mastery jsonb;coverage jsonb:='{}'::jsonb;snapshot jsonb;old_subject text;old_scope text;old_timezone text;notification uuid;begin
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

create or replace function private.notification_worker(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare kind text:=p_command->>'kind';o private.notification_outbox%rowtype;d public.notification_deliveries%rowtype;n public.notifications%rowtype;pref jsonb;source jsonb;result jsonb:='[]'::jsonb;token uuid;until_at timestamptz;payload jsonb;email text;begin
 perform private.notification_service_access();
 if p_command is null or octet_length(p_command::text)>16000 then raise exception 'Invalid worker request' using errcode='22023';end if;
 if kind='dispatch' then return private.notification_dispatch(null,null,25);
 elsif kind='heartbeat' then
  update private.notification_runtime set dispatcher_enabled=true,email_enabled=coalesce((p_command->>'email')::boolean,false),push_enabled=coalesce((p_command->>'push')::boolean,false),push_public_key=case when coalesce((p_command->>'push')::boolean,false) then p_command->>'pushPublicKey' end,last_success_at=now(),last_failure_code=null where id;return '{"ok":true}'::jsonb;
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
  update private.notification_outbox set status='pending',scheduled_for=now()+make_interval(secs=>least(43200,greatest(1,(p_command->>'delay')::integer))),lease_token=null,lease_until=null,publish_attempts=0 where notification_outbox.kind='delivery' and entity_id=(p_command->>'id')::uuid;return '{"ok":true}'::jsonb;
 elsif kind='delivery.finish' then
  select * into d from public.notification_deliveries where id=(p_command->>'id')::uuid and lease_token=(p_command->>'leaseToken')::uuid and status='processing' for update;
  if d.id is null then return '{"stale":true}'::jsonb;end if;
  if p_command->>'status' not in ('delivered','retry','failed','suppressed') or coalesce(p_command->>'code','')!~'^[a-z0-9_]{0,80}$' then raise exception 'Invalid delivery completion' using errcode='22023';end if;
  update public.notification_deliveries set status=case when p_command->>'status'='retry' then 'queued' else p_command->>'status' end,provider_message_id=left(p_command->>'providerId',160),provider_status=case when p_command->>'status'='delivered' then 'accepted' else provider_status end,delivered_at=case when p_command->>'status'='delivered' then now() end,failed_at=case when p_command->>'status'='failed' then now() end,failure_code=p_command->>'code',lease_until=null,updated_at=now() where id=d.id;return '{"ok":true}'::jsonb;
 elsif kind='push.accepted' then
  update public.notification_deliveries set render_snapshot=jsonb_set(render_snapshot,'{pushAccepted}',coalesce(render_snapshot->'pushAccepted','[]')||jsonb_build_array(p_command->>'subscriptionId')) where id=(p_command->>'id')::uuid and lease_token=(p_command->>'leaseToken')::uuid and status='processing';return jsonb_build_object('saved',found);
 elsif kind='push.expired' then
  select * into d from public.notification_deliveries where id=(p_command->>'deliveryId')::uuid and lease_token=(p_command->>'leaseToken')::uuid and status='processing';if d.id is null then raise exception 'Invalid delivery lease' using errcode='42501';end if;
  update public.push_subscriptions set revoked_at=now() where id=(p_command->>'id')::uuid and user_id=d.user_id;delete from private.notification_push_credentials where subscription_id=(p_command->>'id')::uuid and user_id=d.user_id;return '{"ok":true}'::jsonb;
 elsif kind='dead_letter' then
  if p_command->>'entityType'='delivery' then update public.notification_deliveries set status='failed',failed_at=now(),failure_code='queue_exhausted',lease_until=null where id=(p_command->>'id')::uuid and status in ('pending','queued','processing');else update public.weekly_reports set status='failed',failure_code='queue_exhausted' where id=(p_command->>'id')::uuid and status<>'ready';end if;return '{"ok":true}'::jsonb;
 elsif kind='ops.stats' then
  return jsonb_build_object('runtime',(select jsonb_build_object('dispatcherEnabled',dispatcher_enabled,'lastDispatchAt',last_dispatch_at,'lastSuccessAt',last_success_at,'emailConfigured',email_enabled,'pushConfigured',push_enabled) from private.notification_runtime where id),'outbox',(select jsonb_object_agg(x.status,x.n) from(select status,count(*) n from private.notification_outbox group by status)x),'deliveries',(select jsonb_object_agg(x.status,x.n) from(select status,count(*) n from public.notification_deliveries group by status)x),'reports',(select jsonb_object_agg(x.status,x.n) from(select status,count(*) n from public.weekly_reports group by status)x),'oldestDueSeconds',(select greatest(0,extract(epoch from now()-min(scheduled_for))) from private.notification_outbox where status='pending' and scheduled_for<=now()));
 elsif kind='provider.event' then
  if p_command->>'eventType' not in ('email.delivered','email.bounced','email.complained','email.delivery_delayed') then return '{"ignored":true}'::jsonb;end if;
  insert into private.notification_provider_events(provider,event_id,delivery_id,event_type) select 'resend',left(p_command->>'eventId',160),id,p_command->>'eventType' from public.notification_deliveries where provider='resend' and provider_message_id=p_command->>'providerId' on conflict do nothing;
  if found then update public.notification_deliveries set provider_status=p_command->>'eventType' where provider='resend' and provider_message_id=p_command->>'providerId';end if;return '{"ok":true}'::jsonb;
 else raise exception 'Unknown worker operation' using errcode='22023';end if;
end $$;

create or replace function private.notification_detail(p_slug text,p_id uuid) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare n public.notifications%rowtype;source jsonb;begin perform private.notification_access(p_slug);select * into n from public.notifications where id=p_id and user_id=(select auth.uid()) and public.is_workspace_member(workspace_id);if n.id is null then raise exception 'Notification not found' using errcode='42501';end if;source:=private.notification_current(n,now());
 return jsonb_build_object('id',n.id,'currentSource',source,'deliveries',coalesce((select jsonb_agg(jsonb_build_object('channel',d.channel,'status',d.status,'providerStatus',d.provider_status,'scheduledFor',d.scheduled_for,'deliveredAt',d.delivered_at,'failureCode',d.failure_code) order by d.channel) from public.notification_deliveries d where d.notification_id=n.id),'[]'),'report',case when n.report_id is not null then(select jsonb_build_object('id',r.id,'status',r.status,'snapshot',r.summary_json) from public.weekly_reports r where r.id=n.report_id) end);
end $$;

alter function private.notification_inbox(text,jsonb,jsonb,integer) volatile;
alter function private.notification_settings(text) volatile;
alter function private.notification_report(text,uuid) volatile;
alter function private.notification_schedule_preview(text,jsonb,text,uuid) volatile;
