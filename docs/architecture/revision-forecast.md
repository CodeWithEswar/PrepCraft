# Revision Forecast

PostgreSQL groups active due timestamps by workspace-local date for 30 days. Existing overdue work joins today's backlog. Horizon shows known 7/14/30-day dates, with accessible day/count buttons and tap/focus details. It never generates hypothetical later reviews.

Workload estimates use each item's latest recorded attempt duration. Zero/missing duration stays unknown. Mixed buckets expose known minutes and unknown-duration counts. These estimates are not focused time.

Today receives scoped candidates, reasons, due/overdue counts and estimates through Revision's public server contract. Planning receives aggregate date/count/known-minute/unknown counts without creating daily-task projections or moving learning dates.

Queries batch entity resolution and aggregate in PostgreSQL. The active owner/due partial index, identity uniqueness and item/time history indexes match actual access paths. Queue/history pages are bounded. Inspect measured EXPLAIN plans before adding precomputation or speculative indexes.
