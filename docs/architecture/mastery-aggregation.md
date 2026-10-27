# Mastery Aggregation & History

The source RPC batches all topic/pattern metadata into bounded window aggregates; it does not issue one query per area. Initial windows are 7/30/90/365 days (1Y is deliberately bounded). Partial completed-at/owner indexing supports direct timestamp predicates. Timing uses PostgreSQL percentiles. No full attempt history is downloaded to the browser. The overview displays at most 200 effective curriculum areas.

Workspace totals count each source attempt once even when it contributes to both a topic and a pattern. Profiles count qualitative areas, not averaged percentages. Curriculum priority and required status affect action ranking; templates are never mutated. Untested difficulty and unassigned topics stay explicit gaps.

Evidence Lens uses overview aggregates and lazily queries Evidence Spine. Spine pages are 30 rows plus one lookahead, with timestamp/UUID keysets preserving tied timestamps. Mastery Delta compares two bounded equal-length windows, one ending 14 days earlier, under the same current policy and attribution. It is labelled a recalculation, not a stored historical snapshot. Historical failure does not block the current interpretation.

Derived snapshots/findings are not persisted at this scale. TanStack keys include user, workspace, policy, window and entity as applicable. Evidence commits invalidate only affected domain prefixes; there are no per-keystroke calculations or broad realtime subscriptions. Benchmark before introducing materialized projections or Cloudflare workers. Fixture EXPLAIN ANALYZE output is recorded in docs/design/workspace/mastery-query-plan.json; it is not a production scale benchmark.
