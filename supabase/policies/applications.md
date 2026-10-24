# RLS Policies — Applications & Recruitment Pipeline

## Tables Covered
- `public.applications` (Job application target: company, role, location, compensation target)
- `public.application_stages` (Append-only stage progression: wishlist, applied, screening, technical, offer, rejected)
- `public.application_events` (Activity timeline: recruiter calls, follow-up dates, document submissions)

## Scope & Responsibility
The `applications` domain tracks job opportunities and hiring pipeline state. Real round execution belongs to `interviews`.

## Invariants
1. **Pipeline Isolation**: Candidates can view, create, and mutate applications exclusively within workspaces where they hold active membership.
2. **Stage Progression Append-Only**: Stage updates append a new entry to `application_stages`; previous stage timestamps cannot be retroactively modified or deleted.
3. **Application State Consistency**: The current stage cache on `applications` is updated through verified domain transitions, backed by the append-only stage log.
4. **Timeline Privacy**: Recruiter contacts, compensation notes, and referral details are strictly private to the workspace.
5. **No Cross-Workspace Leaks**: Cross-tenant queries are blocked unconditionally by PostgreSQL RLS.

## Example SQL Policy Reference

```sql
-- Read access restricted to active workspace members
create policy "Applications accessible only by workspace members"
  on public.applications
  for select
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

-- Stage progression history append-only insertion
create policy "Application stages insertable only by workspace members"
  on public.application_stages
  for insert
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );
```
