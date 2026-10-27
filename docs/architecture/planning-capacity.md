# Capacity and calendar semantics

Capacity precedence is date override → recurring weekday → workspace configured study days and daily minutes → unset. An unset week is not an intentional seven-day rest schedule. Explicit rest has zero minutes. The UI retains overloads after availability reductions, so the user can decide what to change. Adding/editing/moving/applying work cannot introduce a capacity violation in the final database transaction.

Available minutes, planned task estimates, remaining work and actual focused minutes are distinct. Completed tasks retain their historical estimates. Deferred/cancelled/skipped projections do not consume current capacity. Today reads the same availability and enforces it when adding or rescheduling a task.

All date keys and Monday boundaries use the workspace timezone, independent of deployment or browser timezone. Optional task windows are stored as UTC instants. Server conversion rejects nonexistent spring-forward wall times and ambiguous fall-back times. SQL requires start/end on the same local date, enough duration, no overlap and consistency with configured availability bounds. Windows are optional; flexible task estimates need no invented clock placement.

Tests include India local dates, year boundaries, 23/25-hour DST days, repeated/nonexistent wall times and explicit rest/override precedence. A workspace timezone change invalidates proposal context. Existing dated plans require review instead of being silently reinterpreted.
