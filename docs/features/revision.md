# Feature: Revision & Spaced Repetition

## Purpose
Schedules deliberate revisit intervals for questions and concepts based on memory decay curves, ensuring long-term retention.

## Ownership
- `src/features/revision/`
- Service: `src/features/revision/services/revision-scheduler.ts`

## Key Capabilities
- Adaptive interval calculation (e.g. 1 day → 3 days → 7 days → 14 days → 30 days)
- Ease-factor updates based on attempt confidence ratings (Hard, Medium, Easy)
- Revisit queue compilation integrated into the candidate's Daily Plan
- Overdue revision handling and graceful catch-up rebalancing

## Invariants
- Completing a revision produces a `revision.completed` event.
- Revision items are scoped to `workspace_id`.
- The revision scheduler operates as a pure domain function, making it 100% unit-testable without database dependencies.
