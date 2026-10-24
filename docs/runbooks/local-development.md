# Local development

Use Node 24 (the version exercised here and in CI), npm, and Git. From the repository root:

```sh
npm ci
npm run dev
```

The preview runs at `http://localhost:3030`. `.env.example` contains empty variable names only. Copy it to ignored `.env.local` if needed. Empty app origin defaults to localhost and empty brand preview flag defaults to false. Marketing needs no Supabase project. Actual Supabase use requires a valid URL and publishable key, or legacy anon key; privileged keys are rejected. Public environment values are embedded at build time, so changing them requires a rebuild.

## Checks

```sh
npm run architecture:check
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e -- --project=chromium
```

Typecheck regenerates Next route types before `tsc`, including on a clean checkout. Playwright starts/reuses port 3030 and discovers `tests/e2e`; `PLAYWRIGHT_CHANNEL=chrome` optionally uses installed Chrome. `FULL_BROWSER_MATRIX=1` additionally requires installed Edge and Playwright Firefox/WebKit. Keep feature/component tests colocated when appropriate; shared tests and setup live under `tests`.

## Supabase

Install Docker and Supabase CLI 2.84.2 (the CI-pinned version). There is no need to link a remote project for local checks.

```sh
supabase start
npm run db:check
npm run db:lint
npm run db:test
supabase stop
```

No product migrations or seeds exist yet. `db:check` validates filenames only; `db:test` executes actual pgTAP and fails when the CLI/stack is unavailable. Local database state is disposable only with the developer's awareness; see the migration runbook before reset.

## Cloudflare

Contracts run in the ordinary unit suite. There is intentionally no worker/dev/deploy command until a real worker and Wrangler configuration exist. See `cloudflare/README.md` for the first-worker checklist. Avoid using production credentials in local tests.
