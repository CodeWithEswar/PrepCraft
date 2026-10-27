# Today Command Center

Today answers what to do next before presenting analytics. `/w/[workspaceSlug]/today` resolves the signed-in user's active membership on the server. The shell remains stable while a domain-shaped loading state is shown. A failed primary read fails closed with a retry boundary.

The reference composition uses a compact context header and target ribbon, a cinematic Next Best Action, an ordered Focus Rail, and a right column containing Preparation Pulse, weekly trajectory, attention and upcoming context. The layout stacks intentionally on mobile; dialogs become Drawers and motion respects reduced-motion preferences. The summit is an optimized 66,882-byte WebP, generated with the built-in image tool. Its source and full prompt are in `../design/workspace/today-summit-provenance.json`.

Today owns daily plans, task projections and execution activity. It does not own Revision schedules, Mastery evidence, Readiness evaluation, interview tracking or recorded focus sessions. Source-backed completion is explicitly rejected by the custom-task mutation API; future source adapters must complete the underlying domain transaction before updating its projection.

## Implemented flows

- Create a deliberate manual daily plan after choosing a curriculum.
- Add a custom preparation task with a category, estimate, notes and required/optional status.
- Start and complete custom tasks with confirmed server results, a local pending state, version conflict detection and retryable failure.
- Skip or reschedule a projection without changing source deadlines. Earlier work stays in an explicit recovery list.
- Mark a day as rest after finishing or moving required work. Return to a preparation day explicitly.
- Review a stale context without replacing tasks, including a changed workspace timezone.
- Keep task estimates separate from actual focused time and preserve a complete day despite optional tasks.

## Current domain availability

| Domain | Existing contract | Live Today behavior |
| --- | --- | --- |
| Workspace, target, preferences | Authorized resolver | Connected |
| Curriculum | Workspace assignment and pinned target | Connected for context/freshness; no invented tasks |
| Daily plans and custom tasks | New RLS-protected tables and transaction API | Connected |
| Revision, Mastery, Readiness | Not implemented in this repository | Typed contribution contracts; unavailable state |
| Recorded execution time | Execution active intervals | Workspace/user-scoped source projection, split at local midnight; no task-estimate substitution |
| Interview/reminder tracking | Not implemented | Unavailable upcoming state |
| Full plan generation/rebalancing | Not implemented | Explicit manual plan; no claim of automatic generation |

The public `/preview` uses a real empty-state composition with no fabricated Today tasks, readiness, time history or success metrics. Other feature previews remain separately labeled examples. Test fixtures exist only in tests.

Structured telemetry uses the existing allowlisted logger for snapshot duration/failure, source failures, and mutation outcomes. The repository has no configured Sentry SDK/project; this phase does not invent an external telemetry destination. No cron, queue, KV authority, Realtime subscription or Three.js was added.

## Verification

Run `npm run test:today:db` for real embedded PostgreSQL execution of the Today migrations, constraints, RLS and transactional flows. This uses pinned PGlite with minimal upstream schema/auth fixtures, not the full Supabase stack. Docker/Podman is absent on this machine; CI should also run the complete migration chain and Supabase SQL tests.

Run `npx vitest run src/features/today/tests` for priority/status/timezone/UI workflows, `node scripts/audit-today.mjs` for ten viewport checks and light/dark desktop/mobile accessibility, and the workspace Playwright suite for real browser navigation/select interaction. The remote migration and permissions were also verified through the Supabase CLI after the user explicitly requested a push. No synthetic account or preparation history was inserted into the linked project.
