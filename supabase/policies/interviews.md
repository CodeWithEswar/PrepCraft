# RLS Policies — Interviews & Real Rounds

## Tables Covered
- `public.interviews` (Company interview process container)
- `public.interview_rounds` (Specific phone screen, OA, technical, or behavioral round)
- `public.interview_questions` (Problems encountered during the round)
- `public.interview_debriefs` (Post-interview reflection, outcome, and takeaways)

## Scope & Responsibility
PrepCraft tracks **real-world interview experiences and online assessments (OAs)**. It does not provide AI mock interviews. All interview records are private preparation assets owned by the workspace candidate.

## Invariants
1. **Workspace Isolation**: A user can select, insert, update, or delete interview entities only if they have an active membership row in `workspace_members` linking their `user_id` to the resource's `workspace_id`.
2. **Round Cascade Integrity**: Rounds and debriefs inherit workspace scoping from their parent interview via `workspace_id` foreign keys and PostgreSQL constraints.
3. **Question Encounter Journaling**: Linking an encountered problem to `interview_questions` does not mutate the canonical question catalog (`public.questions`).
4. **Debrief Privacy**: Reflection notes, salary discussions, recruiter feedback, and candidate takeaways are strictly private to the workspace.
5. **No Anonymous or Public Access**: No interview data is readable by anonymous users or unauthenticated API callers.

## Example SQL Policy Reference

```sql
-- Read access strictly scoped to active workspace members
create policy "Interviews readable only by workspace members"
  on public.interviews
  for select
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

-- Mutation access strictly scoped to active workspace members
create policy "Interviews mutable only by workspace members"
  on public.interviews
  for all
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );
```
