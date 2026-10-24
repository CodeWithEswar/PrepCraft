# 0001: Supabase is the system of record

**Status:** Accepted, 24 October 2026.

**Context:** Workspace preparation records need relational integrity, membership isolation, history and a single authoritative write path.

**Decision:** Use Supabase Auth and PostgreSQL, with SQL migrations, constraints, RLS and generated database types after the first schema. R2 stores bytes while PostgreSQL stores authoritative metadata. Derived caches remain replaceable.

**Alternatives:** D1 as a second database, separate persistence per worker, or Prisma. These add ownership ambiguity or duplicate infrastructure without a current need.

**Consequences:** Feature queries use the caller's identity; service-role access is exceptional. Database CI must execute SQL and isolation tests. Current phase adds boundaries and baseline tests only, not product tables.
