# Human-Readable RLS Policy Reference

This directory provides human-readable documentation and architectural rationale for Supabase Row Level Security (RLS) policies, organized by domain:

- [Workspaces & Membership](workspaces.md): Profile isolation, workspace membership invariants, and owner capabilities.
- [Practice, Questions & Attempts](practice.md): Canonical question catalog vs workspace-owned questions, attempt immutability, mistakes, and revisions.
- [Interviews & Real Rounds](interviews.md): Company interview rounds, OAs, question encounter journals, and debrief notes.
- [Applications & Pipeline](applications.md): Job search stages, append-only history, and recruiter notes.

## Critical Invariants

1. **Migrations Are the Sole Deployment Authority**:
   Never maintain standalone deployable policy scripts outside of `supabase/migrations/`. These Markdown files describe security intent, allowed actors, permitted operations, and invariant constraints; migrations execute and enforce them.
2. **Exhaustive RLS Enablement**:
   Every table in the `public` schema must execute `alter table <schema>.<table> enable row level security;` and `alter table <schema>.<table> force row level security;`.
3. **Workspace Isolation Path**:
   All tenant-owned tables must enforce access using active membership:
   ```sql
   workspace_id in (
     select workspace_id from public.workspace_members
     where user_id = auth.uid()
   )
   ```
4. **No Service-Role Key on Client**:
   The `service_role` key must never be used in browser clients or Client Components. All client interactions use authenticated JWTs bound to `auth.uid()`.
