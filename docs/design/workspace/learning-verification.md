# Learn verification — 2026-10-25

Implemented release: unified Learn UI and content/evidence foundation, 25 original published lessons and assessed activities across five subjects, 67 structured topics and 782 explicitly planned outline entries. This is a first production slice, not a claim that every outlined concept has a lesson.

## Checks

- Full Vitest suite: 44 files / 337 tests passed. After the early-repeat correction, the focused Learning/Revision suite passed 68 tests.
- Ephemeral real PostgreSQL (PGlite) fixture: 69 checks passed, including hidden keys, forced RLS, owned notes/progress, direct-write denial, draft lifecycle, prerequisite cycles, canonical identity, objective evaluation, generic-debrief bypass prevention, timeout, idempotency, exclusions, early repeat versus due recall, and six EXPLAIN ANALYZE queries.
- Production Chrome regression: 15 tests passed across Learning, Execution, Planning, Revision, Mastery and the workspace shell.
- Responsive page audit: all ten requested viewport sizes, no document or content overflow.
- Accessibility: 18 automated WCAG-tagged reports, zero violations. Includes desktop/mobile in both themes, all five mobile Concept Lens tabs, and full reading/Scheduler Lab at 390 and 1440 widths. Automated checks do not replace a manual accessibility certification.
- Production Webpack build passed; scoped ESLint, TypeScript and architecture checks passed. Architecture graph: 431 modules.
- Browser SQL: real SELECT output, syntax error, prohibited write, output cap and absent auth.users schema verified. No Supabase data/auth API requests during local execution. Java has no configured external runner and remains explicitly unavailable.
- Development hydration delays occurred while bundles were recompiling. All browser regressions passed against stable production assets on port 3031 using playwright.production.config.ts.

## Supabase

Applied migrations: 20261025105708, 20261025120035 and 20261025121332. Live metadata verified seven public tables with enabled/forced RLS, no direct authenticated updates, no anonymous reads, private answer keys, evaluator guard, immutable keys, 25 published concepts/activities, shared Revision consumption and early-repeat exclusion from Mastery.

Security advisors report the same pre-existing public workspace/bootstrap helper grants and disabled leaked-password protection; no new Learning advisor object was reported. This is not a claim that the whole project has no security findings.

The database fixtures use stubbed Auth context with real PostgreSQL grants/RLS and small data. Query plans are not scale benchmarks. No private production user data was read for verification.

## Remaining scope

Further publication, mixed/section-test composition, open-ended rubric evaluation, a platform authoring workflow, and a sandboxed Java provider remain future work. The current real Mistake Journal domain is absent; optional controlled self-reported tags are captured on the shared attempt/event contract. Local SQL is exploratory, not trusted assessment grading. No fake runner, journal, readiness, streak or mastery score is presented.

## Reproduce

- npm test -- --maxWorkers=2
- npm run test:learning:db
- npm run build:webpack
- node node_modules/next/dist/bin/next start -p 3031 -H 127.0.0.1
- npx playwright test --config=playwright.production.config.ts --workers=1
- node scripts/audit-learning.mjs http://localhost:3031
- node scripts/audit-learning-details.mjs http://localhost:3031
