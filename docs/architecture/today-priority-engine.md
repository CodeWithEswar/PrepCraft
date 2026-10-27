# Explainable Today ranking

`src/features/today/services/priority-engine.ts` is a pure deterministic service using `today-priority-v1`. No database, server runtime, AI request or random ordering is involved.

Eligibility precedes scoring: candidates must belong to the authorized workspace, be planned/in progress, unblocked, dependency-satisfied, in their applicable period and due for the current day (or explicitly reported due by Revision). Rest days only admit explicit critical obligations. Completed, deferred, skipped and future unscheduled tasks are not recommended.

Priority tiers protect critical work from penalties: critical tasks and required interview/assessment deadlines within a day or overdue required revisions precede normal required tasks, then recommended work, then optional work. Critical deadlines are ordered before weighted scores. Within a tier, an in-progress task receives continuity preference.

Normalized signals all use 0–1. Weights are urgency 22, revision 24, evidence-backed weakness 14, target alignment 16 and overdue 18. Deadline urgency increases across seven days; overdue influence caps at seven days so an ancient obligation cannot grow without limit. Revision states are source-provided (soon/today/overdue), never recalculated spaced repetition. Weakness and alignment are source-provided evidence; a small attempt count is not weakness.

Scheduling diversity subtracts at most 12 points: up to 8 for recent time concentrated in the same area and up to 6 for the same category in the three most recent tasks. Intentional revision repetition has no repetition penalty. No medical or psychological fatigue is inferred. Tier ordering ensures these adjustments cannot put trivial optional work above critical requirements.

Stable tie order is tier, critical deadline, in-progress continuity, weighted score, due time, scheduled order, creation time and stable ID. Database row ordering is never an implicit tie-breaker. Results return the task, rank, policy version, reason codes and scheduling adjustments. Scores stay out of the user interface.

Tests cover invalid candidates, tomorrow's interview against revision, overdue versus optional work, normalized bounds, diversity penalties, rest days, determinism and explanation consistency. Tuning is a policy version change reviewed alongside these cases, not a scatter of frontend constants.
