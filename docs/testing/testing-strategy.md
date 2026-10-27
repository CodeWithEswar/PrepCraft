# Platform verification

Run npm run architecture:check, npm run lint, npm run typecheck, npm test, npm run test:platform:db and npm run build. Platform SQL tests use the existing PGlite domain fixture and do not contact production.

CI starts/reset a local Supabase instance, lints/tests SQL and checks generated types against that local schema. It never needs production credentials. Worker dry runs validate bindings and bundling without publishing.

scripts/operations/verify-platform.mjs --live is explicit: it creates an isolated task-owned user/workspace and small text object, verifies private upload/download and replay denial, waits for queued deletion, and removes only its own fixture. If cleanup is uncertain it retains IDs under .wrangler for investigation. Never run live probes automatically in CI.

Keep a separate record of actual command outcomes. A production build is not proof of Vercel deployment, and emulated R2 tests are not proof of private production bucket settings.
