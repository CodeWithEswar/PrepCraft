# RLS Policies — Practice, Questions & Attempts

## Tables Covered
- `public.questions` (Canonical catalog)
- `public.workspace_questions` (Candidate notes & state)
- `public.question_attempts` (Immutable execution records)
- `public.mistakes` (Mistake journal)
- `public.revisions` (Spaced repetition intervals)

## Invariants
1. **Canonical Questions**: Global read access for all authenticated users; modifications restricted to administrative/service-role migrations.
2. **Workspace Question Scoping**: Candidates can read, insert, and update `workspace_questions` only within workspaces they belong to.
3. **Attempt Immutability**: Attempts are append-only. Members can insert attempts and select past attempts within their workspace, but cannot update past records.
4. **Mistakes & Revisions**: Strictly scoped to `workspace_id`. Cross-workspace reads or mutations are rejected by RLS.

## Example SQL Policy Reference
```sql
-- Read attempts only within member workspaces
create policy "Attempts accessible only by workspace members"
  on public.question_attempts
  for select
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );
```
