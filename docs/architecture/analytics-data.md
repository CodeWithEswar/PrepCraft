# Analytics data boundary

Server entry points resolve the authenticated workspace before reading evidence. Four authenticated public invoker functions delegate to private security-definer functions with an empty search path. Each private function rechecks live membership through Revision's shared access boundary and uses explicit workspace/user predicates. Private helpers are revoked from API roles. Archived workspaces permit reads with editing disabled.

`analytics_core` normalizes bounded terminal attempt metadata, aggregates distributions and produces bounded chart projections. `analytics_activity` merges calendar-clipped focus and combines shared Planning/Revision projections. `analytics_interviews` consumes persisted simulations, actual phase events and committed Behavioral bindings. `analytics_history` provides a thirty-row `(session ended at, attempt ID)` descending keyset. No answer/code/story/reflection body is transported.

The RSC loader batches independent source calls. Source errors are isolated; scope mismatches fail closed. Mastery is consumed through its public server entry and projected to at most eighty small display results. Browser reducers do not download histories to calculate scores. Evidence-cache keys include workspace, user, filters and cursor.

No new tables, materialized views, D1 store or worker pipeline are introduced. Existing domain tables remain truth. SQL limits are visible in the UI, disable comparison when reached and require narrowing the window. No source fixture is imported by the live query path.

The disposable PostgreSQL fixture verifies metrics, timezone boundaries, hint timing, privacy, configuration grouping, cross-workspace/user denial, revoked helpers and archived reads. Full Docker/Supabase integration is not claimed; PGlite uses explicit Auth/RLS scaffolding.
