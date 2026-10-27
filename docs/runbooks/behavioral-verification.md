# Behavioral verification

Run node scripts/database/test-behavioral.mjs for a real ephemeral PGlite/PostgreSQL fixture with Auth scaffolding. It verifies scoped reads/writes, concurrency/idempotency, cue-before-disclosure, guarded debrief, meaningful-attempt exclusion, Revision routing/current snapshots/retirement, Mastery separation, framework switching/custom ownership, canonical immutability and archived access. This does not replace full Docker Supabase integration CI.

Run npm test, npm run architecture:check, npm run db:check and npm run build:webpack. After starting the production build on 3031, run npx playwright test tests/e2e/behavioral.spec.ts --config=playwright.production.config.ts and node scripts/audit-behavioral.mjs. The browser audit checks ten widths and both themes across portfolio, Forge and practice. Reports/screenshots live in docs/design/workspace.

Only push the unapplied Behavioral migration with the Supabase CLI after the fixture passes. Verify linked migration history, inspect RLS/grants/function exposure and run database advisors. Never seed sample personal stories into production. Never modify previously applied migrations.
