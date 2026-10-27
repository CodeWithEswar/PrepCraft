-- Preserve paused state when a one-time or relative schedule no longer has a future occurrence.
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
   next_at:=case when r.enabled and r.archived_at is null then private.notification_next(schedule,now()) end;
   if r.enabled and next_at is null then raise exception 'Choose a future schedule before resuming this reminder' using errcode='22023';end if;
   update public.reminder_schedules set next_run_at=next_at,anchor_at=(source->>'anchorAt')::timestamptz,updated_at=now() where reminder_id=r.id;
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
