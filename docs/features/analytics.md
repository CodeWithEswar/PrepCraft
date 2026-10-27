# Analytics

Analytics is an authenticated, personal evidence and decision layer within a workspace. It reads Execution, Planning, Revision, Learning, Behavioral and the canonical Mastery engine. It owns no attempt, schedule, Mastery or Readiness truth.

Routes are `/w/[workspaceSlug]/analytics`, then `/dsa`, `/timing`, `/consistency`, `/interviews` and `/topics`. The corresponding `/preview/analytics` routes use isolated, server-generated illustrative samples. Preview actions cannot write account progress.

Filters are validated on the server and by the SQL boundary, serialized in the URL and preserved between views. Invalid/future URL ranges produce an explicit warning and a default complete-day window. Custom windows are limited to 366 days. Workspace timezone, source period, grouping, sample size and policy are visible.

Every plot includes a question, summary, Evidence Lens, bounded data table and copy action. Individual source failures preserve the remaining page. Metadata drilldown is keyset-paginated; code, answers, STAR bodies and private reflections are excluded.

Practice and Revision actions open their existing workflows. Add to plan validates a canonical topic and opens Planning's ordinary explicit-save task editor. No mutation occurs from an Analytics read.

Readiness snapshots, interview tracker outcomes and project evaluation are not connected. Stored mock facets are self-reported. The earlier Mock UI currently uses fixtures; live Analytics deliberately reads persisted database records instead.

Validation commands: `npm test`, `npm run test:analytics:db`, `npm run architecture:check`, `npm run build:webpack`, and the production Playwright Analytics suite. See the query-plan and accessibility reports for measured limits.
