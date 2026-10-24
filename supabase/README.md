# Supabase infrastructure

Supabase PostgreSQL is PrepCraft's authoritative relational store. This root owns local configuration, immutable migrations, reviewed seed catalogs, policy rationale and database tests. There are currently no product migrations, user fixtures or active authentication routes.

Run npm run db:check for static migration naming validation. Actual SQL/RLS checks require Docker and Supabase CLI 2.84.2: supabase start, npm run db:lint, npm run db:test. Missing infrastructure is a failure, not a silent skip. Database CI runs these checks on a fresh local stack.

The SQL baseline verifies platform schemas/roles. The RLS baseline detects exposed public application tables without RLS; it does not prove tenant authorization while no product tables exist. Every first feature migration must bring role/tenant fixtures. Seeds remain disabled until reviewed catalog scripts exist.

Deployable policies belong in migrations; policies/ contains explanations only. Generate src/lib/supabase/types.ts from local schema after the first real migration; its current empty type is a pre-schema placeholder. Never reuse a server client across requests or expose privileged credentials in public environment variables.

See [database architecture](../docs/architecture/database.md), [RLS contract](../docs/security/rls.md), and [migration runbook](../docs/runbooks/migrations.md).
