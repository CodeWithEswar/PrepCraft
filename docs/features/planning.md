# Feature: Planning & Today Command Center

## Purpose
Manages candidate schedules, daily task allocation, workload balancing, and the primary daily command center.

## Ownership
- `src/features/planning/` (planning domain, calendar calculations, rebalancing engine)
- `src/features/today/` (daily command center presentation & quick action execution)
- Target routes:
  - `src/app/(workspace)/w/[workspaceSlug]/today/`
  - `src/app/(workspace)/w/[workspaceSlug]/plan/`

## Key Capabilities
- Daily preparation queue compilation (due revisions + planned new topics + active target milestones)
- Dynamic rebalancing: rollover of unfinished tasks with cognitive overload prevention
- Today action cards: quick launch for practice, revision, and upcoming interview prep
- Weekly overview calendar and milestone tracking

## Boundary Distinction
`src/features/today/` is a user-facing presentation module that composes planning, revision, and interview data. The actual plan generation algorithms belong exclusively to `src/features/planning/services/`.
