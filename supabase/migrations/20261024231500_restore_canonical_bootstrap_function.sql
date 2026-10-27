-- Migration: Restore Canonical Bootstrap Initial Workspace Function Signature
-- Timestamp: 20261024231500

drop function if exists public.bootstrap_initial_workspace(uuid, text, text, text, text, text, text, text, text, integer, text[], integer, date, text, integer, integer, text[], jsonb, jsonb);
drop function if exists public.bootstrap_initial_workspace(uuid, text, text, text, text, text, text, text, text, integer, text[], integer, date, text, integer, integer, text[]);
drop function if exists public.bootstrap_initial_workspace cascade;

create or replace function public.bootstrap_initial_workspace(
  p_user_id uuid,
  p_workspace_name text,
  p_workspace_slug text,
  p_role_family text,
  p_role_name text,
  p_company_id text default null,
  p_company_name text default null,
  p_custom_company_name text default null,
  p_preferred_coding_language text default null,
  p_weekly_target_minutes integer default 600,
  p_study_days text[] default array['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::text[],
  p_default_daily_minutes integer default 120,
  p_target_date date default null,
  p_template_id text default null,
  p_total_weekly_minutes integer default 600,
  p_planned_sessions integer default 5,
  p_focus_areas text[] default array[]::text[],
  p_first_week_plan jsonb default '[]'::jsonb,
  p_starter_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_workspace_id uuid;
  v_slug_base text;
  v_unique_slug text;
  v_counter integer := 1;
  v_existing_workspace_id uuid;
  v_existing_slug text;
begin
  -- Idempotency check: find active workspace where user is owner
  select w.id, w.slug into v_existing_workspace_id, v_existing_slug
  from public.workspaces w
  inner join public.workspace_members wm on wm.workspace_id = w.id
  where wm.user_id = p_user_id and wm.role = 'owner'
  limit 1;

  if v_existing_workspace_id is not null then
    return jsonb_build_object(
      'workspace_id', v_existing_workspace_id,
      'workspace_slug', v_existing_slug,
      'idempotent', true
    );
  end if;

  -- Generate clean slug
  v_slug_base := coalesce(nullif(trim(p_workspace_slug), ''), lower(regexp_replace(trim(p_workspace_name), '[^a-zA-Z0-9]+', '-', 'g')));
  v_slug_base := trim(both '-' from v_slug_base);
  if v_slug_base = '' or v_slug_base is null then
    v_slug_base := 'prep-workspace';
  end if;

  v_unique_slug := v_slug_base;
  while exists (select 1 from public.workspaces where slug = v_unique_slug) loop
    v_counter := v_counter + 1;
    v_unique_slug := v_slug_base || '-' || v_counter::text;
  end loop;

  -- 1. Create workspace entity
  insert into public.workspaces (
    name,
    slug,
    created_by,
    created_by_user_id,
    status,
    timezone
  )
  values (
    p_workspace_name,
    v_unique_slug,
    p_user_id,
    p_user_id,
    'active',
    'UTC'
  )
  returning id into v_workspace_id;

  -- 2. Add owner membership
  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    status,
    joined_at
  )
  values (
    v_workspace_id,
    p_user_id,
    'owner',
    'active',
    now()
  );

  -- 3. Insert workspace target
  insert into public.workspace_targets (
    workspace_id,
    role_family,
    role_name,
    company_id,
    company_name,
    custom_company_name,
    target_date,
    preparation_level,
    interview_language,
    template_id,
    template_version
  )
  values (
    v_workspace_id,
    p_role_family::text,
    p_role_name,
    p_company_id,
    p_company_name,
    p_custom_company_name,
    p_target_date,
    'developing',
    coalesce(p_preferred_coding_language, 'java'),
    p_template_id,
    1
  );

  -- 4. Insert workspace preferences
  insert into public.workspace_preferences (
    workspace_id,
    weekly_target_minutes,
    default_daily_minutes,
    study_days,
    planning_mode
  )
  values (
    v_workspace_id,
    coalesce(p_weekly_target_minutes, 600),
    coalesce(p_default_daily_minutes, 120),
    coalesce(p_study_days, array['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::text[]),
    'balanced'
  );

  -- 5. Insert workspace settings for legacy backward compatibility
  insert into public.workspace_settings (
    workspace_id,
    weekly_target_minutes,
    study_days,
    default_daily_minutes,
    preferred_coding_language
  )
  values (
    v_workspace_id,
    coalesce(p_weekly_target_minutes, 600),
    coalesce(p_study_days, array['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::text[]),
    coalesce(p_default_daily_minutes, 120),
    p_preferred_coding_language
  );

  -- 6. Insert initial starter plan
  insert into public.workspace_plans (
    workspace_id,
    template_id,
    total_weekly_minutes,
    planned_sessions,
    focus_areas,
    first_week_plan,
    starter_items,
    status
  )
  values (
    v_workspace_id,
    p_template_id,
    coalesce(p_total_weekly_minutes, p_weekly_target_minutes, 600),
    coalesce(p_planned_sessions, 5),
    coalesce(p_focus_areas, array[]::text[]),
    coalesce(p_first_week_plan, '[]'::jsonb),
    coalesce(p_starter_items, '[]'::jsonb),
    'ready'
  );

  -- 7. Update profile
  update public.profiles
  set last_active_workspace_id = v_workspace_id,
      preferred_coding_language = coalesce(p_preferred_coding_language, preferred_coding_language),
      onboarding_state = 'completed',
      onboarding_completed_at = now(),
      updated_at = now()
  where id = p_user_id;

  -- 8. Emit activity event
  insert into public.workspace_activity_events (
    workspace_id,
    user_id,
    event_type,
    payload
  ) values (
    v_workspace_id,
    p_user_id,
    'workspace.created',
    jsonb_build_object('name', p_workspace_name, 'slug', v_unique_slug)
  );

  -- 9. Clean up temporary draft
  delete from public.onboarding_drafts where user_id = p_user_id;

  return jsonb_build_object(
    'workspace_id', v_workspace_id,
    'workspace_slug', v_unique_slug,
    'idempotent', false
  );
end;
$$;

revoke all on function public.bootstrap_initial_workspace from public;
grant execute on function public.bootstrap_initial_workspace to authenticated, service_role;
