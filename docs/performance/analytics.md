# Analytics performance

Aggregates run in PostgreSQL rather than browser history reducers. Normalized source rows and reused aggregates are materialized inside each query, not stored as a second truth. Interview session IDs are computed once, avoiding a source-function invocation per candidate. Revision due counts are grouped before joining topics.

`analytics-query-plans.json` contains eight EXPLAIN ANALYZE/BUFFERS plans against a disposable 5,000-attempt PGlite account. These are diagnostic measurements on an embedded PostgreSQL runtime, not production latency promises. Full-range scans can be appropriate at high selectivity; indexes are not forced to satisfy a test. The narrow terminal source, end-to-end aggregates and paginated history are all measured.

Existing owner/time indexes are reused; two partial terminal-time indexes support completed attempt/session reads. Additional persistent aggregates and workers require measured production need before introduction.

The loader records only allowlisted duration, payload-byte count, point count and view enum. Payloads above 350KB emit a warning. Scatter/history/graph projections have explicit bounds. The fixture requires core JSON below 180KB at 5,000 attempts. View-specific projection removes unused detail arrays and large Mastery explanations.

The six view components load independently. D3-force is directly pinned at 3.0.0 and loaded only when a desktop user expands the relationship map. No animation loop or full D3 namespace is imported into chart pages. Final build chunk inspection and the browser request audit document the delivered behavior.

Safe local product events are dispatched as `prepcraft:analytics`: viewed, filter.changed, chart.expanded, table.opened and action.clicked. No external analytics provider is configured. Error events contain no exception body or private source record.
