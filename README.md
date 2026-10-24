# PrepCraft

**Craft your way to ready.** A software-engineering interview preparation and tracking workspace: plan, learn, practice, reflect, revise, prepare for real interviews and track applications.

Today the application is a working marketing preview. Phase 03 establishes repository ownership and engineering foundations. Authentication, saved workspaces and product modules are later phases; AI mock interviews are outside scope.

## Architecture in one minute

| Path | Ownership |
| --- | --- |
| src/app | URLs, metadata, layouts and route composition |
| src/features | Product capabilities, UI, schemas, services and server operations |
| src/components | Reusable shadcn UI, brand and Hugeicons presentation |
| src/lib | Environment validation, Supabase clients, technical contracts and observability |
| src/providers | Shared React providers |
| supabase | Authoritative relational/auth infrastructure, migrations and database tests |
| cloudflare | Portable contracts and future justified edge/async/storage workloads |
| tests | Cross-feature unit/integration/component/browser checks |
| docs | Living product, architecture, security and operational decisions |

Routes compose features; features own behavior; shared modules cannot depend upward. Supabase PostgreSQL is the system of record. Cloudflare is an async/edge/storage plane, not a competing database. No D1, Prisma, Redux or premature monorepo is introduced.

## Stack

Next.js 16 App Router, React 19, strict TypeScript, Tailwind, shadcn/Base UI, Hugeicons, Motion and next-themes. Data/form tools are TanStack Query/Table, React Hook Form and Zod; date-fns, Recharts and D3 are available. Supabase SSR clients are prepared but authentication is not activated. Vitest, Testing Library, Playwright and ESLint provide checks. Sentry and Cloudflare runtime integrations are planned, not installed/deployed services.

## Local setup

Use Node 24, npm and Git. Run npm ci, then npm run dev. Open http://localhost:3030. Copy .env.example to ignored .env.local when integration settings are needed. The marketing preview needs no database credentials. Blank application URL defaults to localhost. Supabase clients fail before connection if settings are missing or privileged keys are supplied.

The source of environment access is src/lib/env; only NODE_ENV is allowed elsewhere as a framework compile-time flag. NEXT_PUBLIC values are embedded at build time. Never use that prefix for server secrets.

## Commands

| Command | Purpose |
| --- | --- |
| npm run dev / build / start | Local development / production build / production server on port 3030 |
| npm run architecture:check | Import direction, feature entries, client/server reachability and cycles |
| npm run lint | ESLint |
| npm run typecheck | Generate current Next route types and run TypeScript |
| npm run test | Unit/component and portable contract tests |
| npm run test:e2e | Browser journeys from tests/e2e |
| npm run brand:validate / landing:validate | Existing asset checks |
| npm run db:check | Static migration naming check; does not execute SQL |
| npm run db:lint / db:test | SQL lint / pgTAP against local Supabase |

Install a Playwright browser with npx playwright install chromium before E2E. Use PLAYWRIGHT_CHANNEL=chrome for installed Chrome, or FULL_BROWSER_MATRIX=1 with the additional engines installed.

## Supabase and Cloudflare

Database development requires Docker and Supabase CLI 2.84.2 (the version pinned in CI). Run supabase start, then the database checks. No product migrations or seeds exist yet; seeding is disabled. Add immutable migrations with RLS and isolation tests, then generate database types once real schema exists. See the migration runbook before resetting any local state.

Cloudflare currently contains validated queue contracts and tests only. No worker or Wrangler configuration exists yet, so there is no pretend worker start/deploy command. Create runtime configuration, bindings and worker tests with the first justified workload. Keep secrets in ignored .dev.vars or deployment secret stores.

## Contribution and deployment

Preserve the Graphite Monochrome × Smoked Sienna × Mineral Glass design and existing landing behavior during architecture work. Create only meaningful directories. Domain logic belongs in feature services, not route files, shared UI or giant utils files. Use explicit server-only boundaries, validated trust-boundary inputs and authorization backed by RLS. Report checks actually executed, including unavailable ones.

CI covers application checks, browser journeys, database checks and dependency auditing. No public deployment or production migration runs automatically. Select a compatible Next host/runtime before adding deployment-specific configuration; Cloudflare worker hosting is a separate boundary.

Start with [documentation](docs/README.md), [system overview](docs/architecture/system-overview.md), [local development](docs/runbooks/local-development.md), [migrations](docs/runbooks/migrations.md), [deployment/rollback](docs/runbooks/deployment.md), [feature ownership](docs/features/domain-map.md), and [ADRs](docs/adr/README.md).
