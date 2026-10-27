# PrepCraft

**Craft your way to ready.** A software-engineering interview preparation and tracking workspace: plan, learn, practice, reflect, revise, prepare for real interviews and track applications.

Live at [prepcraft.vercel.app](https://prepcraft.vercel.app). PrepCraft includes Google sign-in, saved workspaces, Today and Planning, recorded Practice and Revision, learning, behavioral preparation, Mastery, Analytics, Notifications and private files. Isolated preview routes use sample data. Live mock recording and external code execution remain unavailable; the interface does not claim those operations were saved or executed.

## Architecture in one minute

| Path | Ownership |
| --- | --- |
| src/app | URLs, metadata, layouts and route composition |
| src/features | Product capabilities, UI, schemas, services and server operations |
| src/components | Reusable shadcn UI, brand and Hugeicons presentation |
| src/lib | Environment validation, Supabase clients, technical contracts and observability |
| src/providers | Shared React providers |
| supabase | Authoritative relational/auth infrastructure, migrations and database tests |
| cloudflare | Private R2 transfer, queues, reconciliation and notification delivery |
| tests | Cross-feature unit/integration/component/browser checks |
| docs | Living product, architecture, security and operational decisions |

Routes compose features; features own behavior; shared modules cannot depend upward. Supabase PostgreSQL is the system of record. Cloudflare is an async/edge/storage plane, not a competing database. No D1, Prisma, Redux or premature monorepo is introduced.

## Stack

Next.js 16 App Router, React 19, strict TypeScript, Tailwind, shadcn/Base UI, Hugeicons, Motion and next-themes. TanStack Query/Table, React Hook Form and Zod manage remote state and forms. Supabase owns identity and relational state; Cloudflare Workers, Queues, Cron and private R2 handle asynchronous work and bytes. Sentry adapters are installed with content redaction, but reporting stays disabled until real DSNs are supplied. Vitest, Testing Library, Playwright and ESLint provide checks.

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

Database development uses Docker and the pinned Supabase CLI 2.122.0. Run npm run db:start, then the local database checks. The repository contains 29 immutable product migrations with RLS and domain isolation tests. Generate database types from the reset local schema and run npm run db:types:check. Never reset production. Local access to the live project requires an explicit ALLOW_LIVE_BACKEND=true opt-in; preview deployments require a separate backend.

Cloudflare configurations live in cloudflare/wrangler/platform.jsonc and notifications.jsonc. The platform default uses emulated local resources; deployment requires an explicit production environment. Keep service credentials in encrypted Worker secrets. Both R2 buckets are private. Email delivery remains disabled while the provider is a placeholder. See [platform architecture](docs/architecture/platform.md) and [verification evidence](docs/operations/platform-verification.json).

## Contribution and deployment

Preserve the Graphite Monochrome × Smoked Sienna × Mineral Glass design and existing landing behavior during architecture work. Create only meaningful directories. Domain logic belongs in feature services, not route files, shared UI or giant utils files. Use explicit server-only boundaries, validated trust-boundary inputs and authorization backed by RLS. Report checks actually executed, including unavailable ones.

CI covers application checks, browser journeys, local database contracts and dependency auditing. GitHub main is connected to the CodeWithEswar/prepcraft Vercel project for production builds. Vercel variables are configured separately from Worker secrets; never upload local env files. Database migrations and Worker deployments remain explicit operations. Sentry reporting and email sending require their own real provider configuration.

Start with [documentation](docs/README.md), [system overview](docs/architecture/system-overview.md), [local development](docs/runbooks/local-development.md), [migrations](docs/runbooks/migrations.md), [deployment/rollback](docs/runbooks/deployment.md), [feature ownership](docs/features/domain-map.md), and [ADRs](docs/adr/README.md).
