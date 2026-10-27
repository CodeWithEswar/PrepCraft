-- Fix capacity calculation when an active daily plan exists on a non-study day (e.g. Saturday/Sunday)
-- Locale-agnostic weekday checking and fallback to workspace default daily minutes when plan is active.

create or replace function private.planning_capacity(p_workspace uuid,p_day date) returns integer language sql stable security definer set search_path='' as $$
  select case
    when exists(select 1 from public.daily_plans where workspace_id=p_workspace and plan_date=p_day and status='rest') then 0
    else coalesce(
      (select case when rest then 0 else minutes end from public.planning_availability_overrides where workspace_id=p_workspace and plan_date=p_day),
      (select case when rest then 0 else minutes end from public.planning_availability where workspace_id=p_workspace and weekday=extract(dow from p_day)::integer),
      (select case
        when exists(select 1 from public.daily_plans where workspace_id=p_workspace and plan_date=p_day and status='active') then greatest(coalesce(default_daily_minutes, 120), 30)
        when (array['sunday','monday','tuesday','wednesday','thursday','friday','saturday'])[extract(dow from p_day)::integer + 1] = any(coalesce(study_days, array[]::text[])) then greatest(coalesce(default_daily_minutes, 120), 30)
        else 0
      end from public.workspace_preferences where workspace_id=p_workspace),
      120
    )
  end
$$;
revoke all on function private.planning_capacity(uuid,date) from public,anon,authenticated;
