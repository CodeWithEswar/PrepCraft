# Database architecture

## Source of truth

Supabase PostgreSQL owns identities, workspaces, membership, canonical questions, attempts, revision schedules, plans, interview/application history and authoritative file metadata. D1 and Prisma are excluded. The empty `Database` type in `src/lib/supabase/types.ts` is explicitly a pre-schema placeholder, not generated proof of a live database.

## Ownership and changes

- `supabase/config.toml`: local infrastructure; PostgreSQL 15 is retained from the existing setup.
- `supabase/migrations`: timestamped immutable schema changes, constraints, indexes, functions, grants, policies and triggers.
- `supabase/seed`: reviewed development or licensed canonical catalogs. Seeding is disabled while no seed exists. Never fabricate personal history for production.
- `supabase/policies`: human-readable rationale; migrations are the only deployable policy source.
- `supabase/tests/sql`: baseline platform checks now; feature constraints and transaction tests later.
- `supabase/tests/rls`: baseline exposed-table RLS coverage now; role/tenant fixtures with each feature migration.

There are currently zero application migrations. Do not add auth or workspace tables in this phase. Migration naming validation is a static check, not SQL execution. Database CI starts a fresh local Supabase stack, resets it, lints SQL and executes pgTAP, without silently skipping an empty application schema.

## Isolation

Workspace-owned records require explicit ownership and RLS on every exposed table. Active membership is checked for reads and writes; insert/update policies must also prevent reassignment to another workspace. Sensitive views/functions and security-definer code need explicit grants, search paths and tests. See the [RLS matrix](../security/rls.md).

Canonical question content is separate from `workspace_questions` state and `question_attempts` history. Application transitions and significant user actions need append-only history. Durable asynchronous requests should be captured in the same transaction as authoritative state; a later dispatcher publishes them.

## Types and validation

After the first real migration, generate types with `supabase gen types typescript --local --schema public` into `src/lib/supabase/types.ts` and add generated-schema drift comparison to database CI. Until then the hand-written empty type must not be advertised as generated or used to bypass typing with `any`.

Tests use pgTAP transactions that roll back. The baseline does not prove tenant isolation when no product tables exist. Each first feature migration must add member/non-member/cross-workspace/disabled-member tests before the feature is complete. See [migration runbook](../runbooks/migrations.md) and [ADR 0001](../adr/0001-supabase-system-of-record.md).
