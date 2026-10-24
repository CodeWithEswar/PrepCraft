# RLS Policies — Applications & Interviews

## Tables Covered
- `public.applications` (Recruitment pipeline)
- `public.application_stages` (Append-only stage history)
- `public.interviews` (Real OA & interview rounds)
- `public.interview_questions` (Encountered questions journal)

## Invariants
1. **Pipeline Isolation**: Candidates can view and mutate applications exclusively within workspaces where they hold active membership.
2. **Stage History Append-Only**: Stage updates create new rows in `application_stages`; history cannot be retroactively modified or deleted.
3. **Interview Security**: Interviews, round notes, and post-interview reflections are visible only to members of the owning workspace.
4. **No Public Read**: Job search and interview data is strictly private and non-shareable without explicit future export features.

## Example SQL Policy Reference
```sql
-- Application isolation policy
create policy "Applications isolated by workspace"
  on public.applications
  for all
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );
```
