# Database Architecture & Infrastructure Contract

## 1. Source of Truth

Supabase PostgreSQL is PrepCraft's single authoritative system of record. It owns user identities, workspaces, active membership, canonical question catalogs, user practice attempts, spaced repetition revision schedules, study plans, job applications, real interview history, and authoritative file metadata. Cloudflare D1 and Prisma are excluded from the repository.

---

## 2. Infrastructure Ownership

All database deployment tooling and schema specifications belong under `supabase/`:

- `supabase/config.toml`: Local Supabase CLI configuration running PostgreSQL 15.
- `supabase/migrations/`: Ordered, immutable, timestamped SQL migrations (`YYYYMMDDHHMMSS_name.sql`). Migrations are the sole deployment authority for tables, columns, constraints, indexes, SQL functions, triggers, and RLS policies.
- `supabase/seed/`: Development-safe, idempotent canonical catalog seeds (DSA tracks, patterns, difficulty tiers, topics). Never place real candidate data, production secrets, or misleading test metrics in seed files.
- `supabase/policies/`: Human-readable documentation of RLS invariants grouped by domain (`workspaces.md`, `practice.md`, `interviews.md`, `applications.md`). Migrations remain the deployment authority.
- `supabase/functions/`: Supabase Edge Functions, used strictly when external HTTP boundaries or webhooks near Supabase are justified.
- `supabase/tests/sql/`: Automated pgTAP tests for constraints, triggers, functions, and schema invariants.
- `supabase/tests/rls/`: Automated pgTAP tests proving tenant isolation, owner capabilities, member permissions, and cross-workspace access rejection.

---

## 3. Database Constraints & Invariants

PostgreSQL enforces data integrity invariants directly at the schema layer:
- `NOT NULL` for required domain attributes.
- `FOREIGN KEY ... ON DELETE CASCADE` or `RESTRICT` for relational integrity.
- `CHECK` constraints for enumerated values, positive numbers, and valid date intervals (e.g. `due_at >= created_at`).
- `UNIQUE` constraints (e.g. `(workspace_id, user_id)` on `workspace_members`).

Application validation via Zod and database constraints serve complementary roles in Defense in Depth.

---

## 4. Indexing Strategy

Indexes are designed based on actual query access paths:
- Foreign keys: `workspace_id`, `user_id`, `question_id`, `application_id`.
- Temporal & status filtering: `due_at`, `status`, `created_at`, `stage`.
- Composite indexes reflecting query cardinality and sorting: `(workspace_id, status, due_at)`.
- Avoid premature indexing of every column; indexes incur storage and write latency overhead.

---

## 5. Workspace Isolation & RLS

Every tenant table in PrepCraft must carry a direct foreign key to `workspace_id` and have Row Level Security enabled and forced:

```sql
alter table public.<table> enable row level security;
alter table public.<table> force row level security;

create policy "Tenant isolation" on public.<table>
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );
```

Never trust a client-supplied `workspace_id` without verifying that `auth.uid()` holds active membership.

---

## 6. SQL Functions vs Edge Functions

- **PostgreSQL Functions (in migrations)**: Internal database triggers, audit logging, atomic state transitions, and search functions running inside the PostgreSQL query engine.
- **Supabase Edge Functions (`supabase/functions/`)**: External HTTP endpoints running on Deno at the edge. Regular application logic belongs in `src/features/<feature>/services/` or Next.js server actions.

---

## 7. Secrets & Security Rules

1. `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. It must never be exposed to the browser, stored in client environment variables, or committed to version control.
2. Production credentials reside strictly in platform secret managers.
3. See [Supabase Operational Manual](../../supabase/README.md) and [ADR 0001](../adr/0001-supabase-system-of-record.md).
