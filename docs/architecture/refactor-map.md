# Phase 03 audit and move plan

The starting repository contains the working marketing page, brand assets, reusable UI/providers, unused Supabase SSR helpers, three Playwright files and a local icon test. There are no product tables, authenticated routes, workers, queues or CI workflows. Existing uncommitted design work is preserved.

| Current | Destination | Reason | Dependencies / risk |
| --- | --- | --- | --- |
| `src/app/page.tsx` composition | `src/features/marketing/components/marketing-page.tsx` | Marketing owns its composition; route retains metadata | Preserve exact element order, CSS order and anchors; moderate visual regression risk |
| `/` route | `src/app/(marketing)/page.tsx` | Separate public surface without changing URL | One root layout retained; no duplicate `/` route |
| `src/lib/metadata.ts` | `src/app/metadata.ts` | Application metadata belongs with routing | Root layout import; metadata and favicon E2E |
| `e2e/*.spec.ts` | `tests/e2e/*.spec.ts` | Cross-feature browser tests share one root | Playwright testDir and documentation references |
| `src/test/setup.ts` | `tests/setup.ts` | Shared test setup | Vitest setupFiles |
| `src/lib/supabase/middleware.ts` | `src/lib/supabase/session.ts` | Request-session helper is not a framework middleware entry | Currently unused; keep dormant until authentication phase |
| Mixed `src/lib/supabase/index.ts` | Type-only exports; explicit client/server imports | Prevent browser imports reaching server infrastructure | No current callers; low risk |

Preserve `src/providers`, `components/ui`, `components/brand`, `components/app-icon`, marketing assets and all CSS. No new product routes or empty feature folders. Future `(auth)`, `(onboarding)` and `(workspace)/w/[workspaceSlug]` surfaces are specified in the frontend/domain documentation and will be created with their first real implementation.

Foundation additions: validated environment access, typed operation results, safe structured logs, versioned queue-envelope validation, dependency/cycle checks, database baseline checks, CI and concise ownership/security/runbook documentation. Supabase remains the sole relational source of truth. Cloudflare gets contracts and an operational plan, not premature worker services.
