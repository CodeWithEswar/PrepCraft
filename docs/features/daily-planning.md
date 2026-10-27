# Daily execution planning

One `daily_plans` record exists per workspace and local plan date. Its IANA timezone and context fingerprint record the preparation context it was created for. The fingerprint combines timezone and target/preferences/curriculum update times, not a client-provided label. Changed context becomes a review state; tasks are never silently regenerated.

`daily_tasks` separates its source from its display category. Custom tasks can belong to DSA, Revision, Aptitude, Programming Language, CS Fundamentals, Projects, Interview / Behavioral, Interview Preparation, Timed Practice or Custom. A custom task labeled Revision is still custom preparation; checking it off never advances a Revision schedule.

Statuses are planned, in_progress, completed, skipped and deferred. A skipped required task remains an unmet obligation and gives a recovery state. Deferral creates a new projection in the chosen plan and marks the old projection deferred. It preserves the source deadline and original planned estimate. Estimates are never rewritten to match completion speed.

The transaction API validates the current local day, membership, workspace status, task version, source rules, destination and row limits. Task additions keep a stable request UUID across retries. Repeat starts and completions are idempotent. Tasks are capped at 100 per daily plan and estimates at 5–480 minutes each; rescheduling is bounded to the coming year. Read queries always load current tasks separately from the bounded prior-30-day recovery list so old work cannot crowd out today.

Daily status is a deterministic planning label, not a readiness score:

| Status | Rule |
| --- | --- |
| Rest Day | Explicit rest plan, without unfinished required tasks |
| Complete | At least one required task and all non-deferred required tasks completed |
| Behind | A required task was skipped, or overdue required work exceeds remaining capacity |
| At Risk | A required deadline passed, or remaining required estimates exceed capacity |
| Ahead | Actual recorded focus meets the planned time, and unfinished requirements still fit capacity |
| On Track | Remaining required work fits capacity, or only optional preparation remains |

Capacity is the lesser of minutes until local midnight and the configured daily budget minus authoritative recorded focus. Unknown focus is not presented as zero. These labels explain budget feasibility, not invented personal pace forecasts. No-plan and no-curriculum are separate page states rather than misleading daily statuses.

The full Planning Engine remains a separate future domain. This phase provides manual plans and a source projection contract, not automatic curriculum allocation or rebalancing.
# Planning ownership update

ADR 0017 refines this initial Today projection: Planning now constructs and adjusts the shared daily rows, including capacity, optional windows, explicit carryover and weekly goals/reviews. Today executes them and reads the same availability. See [Planning](planning.md), [capacity](../architecture/planning-capacity.md) and [carryover](../architecture/planning-carryover.md). Older manual Today entry remains capacity checked; it does not create a separate schedule.

