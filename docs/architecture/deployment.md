# PrepCraft — Deployment, Environments & CI/CD Architecture
## Multi-Platform Delivery, Zero-Downtime Migrations & Environment Isolation

This document specifies the deployment architecture, environment topology, and continuous integration pipeline for PrepCraft across Vercel, Supabase, and Cloudflare.

---

## 1. Multi-Platform Deployment Topology

PrepCraft leverages specialized managed infrastructure platforms for distinct operational workloads:

```text
┌──────────────────────────────────────────────────────────────┐
│                    GIT REPOSITORY (MAIN)                     │
└──────────────────────────────┬───────────────────────────────┘
                               │
               Automated CI    │ Quality Gates
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    CONTINUOUS INTEGRATION (CI)               │
│                                                              │
│  • Linter (eslint)                                           │
│  • Typecheck (next typegen + tsc --noEmit)                   │
│  • Architecture Check (check-architecture.mjs)               │
│  • Unit & Integration Tests (vitest)                         │
│  • Cloudflare Contract Tests (vitest)                        │
│  • Migration Naming & Schema Integrity (check-migrations.mjs)│
│  • Database SQL & RLS Isolation Tests (supabase test db)     │
│  • Next.js Production Build (next build)                     │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ Approved Merge
                               ▼
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    VERCEL    │       │   SUPABASE   │       │  CLOUDFLARE  │
│              │       │              │       │              │
│ Next.js App  │       │  PostgreSQL  │       │   Workers    │
│ Server & RSC │       │  Migrations  │       │   Queues     │
│ Client PWA   │       │  Auth & RLS  │       │   Cron & R2  │
└──────────────┘       └──────────────┘       └──────────────┘
```

---

## 2. Environment Isolation Matrix

All platform resources are strictly segregated across three distinct operational tiers to prevent state contamination:

| Platform Resource | Local Development | Staging Tier | Production Tier |
|---|---|---|---|
| **Next.js Hosting** | `http://localhost:3030` | `https://staging.prepcraft.dev` | `https://prepcraft.dev` |
| **Supabase Project** | Local Docker / Dev Project | `prepcraft-staging` | `prepcraft-prod` (`tkfqomwymkgcnjakppon`) |
| **Cloudflare Workers** | Local Miniflare (`--local`) | `prepcraft-worker-staging` | `prepcraft-worker-prod` |
| **Cloudflare Queues** | Local Queue emulator | `prepcraft-staging-*` | `prepcraft-prod-*` |
| **Cloudflare R2** | Local R2 emulator | `prepcraft-staging-files` | `prepcraft-prod-files` |
| **Cloudflare KV** | Local KV emulator | `prepcraft-staging-cache` | `prepcraft-prod-cache` |
| **Sentry Environment** | `development` (or disabled) | `staging` | `production` |

### Cross-Environment Poisoning Prevention
- Development or staging worker instances are **strictly forbidden** from binding to production queues or R2 buckets.
- Production credentials reside exclusively in Cloudflare Secret Store (`wrangler secret put`) and Vercel Environment Variables.
- No production secrets are committed to Git or checked into `.env.example`.

---

## 3. Backward-Compatible Database Migrations (Expand-and-Contract)

To ensure zero downtime during schema updates, PrepCraft mandates **backward-compatible migrations** following the Expand-and-Contract pattern:

```text
PHASE 1: EXPAND (Database Migration)
  • Add new column or table as nullable or with safe defaults.
  • Old application code continues running safely with no knowledge of the new column.

PHASE 2: DEPLOY COMPATIBLE APPLICATION
  • Deploy Next.js update that writes to both old and new columns, and reads from new column.

PHASE 3: BACKFILL DATA
  • Execute background migration script to populate new column for legacy rows.

PHASE 4: CONTRACT (Future Database Migration)
  • Add NOT NULL constraints to new column.
  • Drop obsolete legacy column safely without deployment race conditions.
```

### Prohibited Operations During Deployments
- Destructive `DROP COLUMN` or `RENAME COLUMN` without a phased deprecation period.
- Long table locks on high-volume tables (`ALTER TABLE ... ADD COLUMN` without default optimization).
- Modifying previously applied, immutable migrations.

---

## 4. Continuous Integration (CI) Quality Gates

A pull request is permitted to merge to `main` only when all of the following quality gates pass:

```bash
# 1. Architecture Dependency Check
npm run architecture:check

# 2. TypeScript Static Analysis
npm run typecheck

# 3. Code Linter
npm run lint

# 4. Automated Vitest Suites (Unit, Integration & Cloudflare Tests)
npm run test

# 5. Database Schema & Migration Validation
npm run db:check
npm run db:lint
npm run db:test

# 6. Next.js Production Build
npm run build
```

---

## 5. Backup, Disaster Recovery & Telemetry

- **PostgreSQL Point-in-Time Recovery (PITR)**: Supabase automated daily backups with PITR enabled for production.
- **R2 Data Durability**: Cloudflare R2 provides 99.999999999% (11 9s) annual durability across multi-datacenter replication.
- **Reproducible Derived Analytics**: Analytics views and aggregate metrics are derived from immutable PostgreSQL activity events and question attempts. If an analytics cache is corrupted, it can be rebuilt deterministically from transactional history.
