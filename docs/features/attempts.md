# Feature: Attempts & Mistake Journal

## Purpose
Records immutable problem-solving attempts, captures candidate reflections, and tracks categorized mistakes.

## Ownership
- `src/features/attempts/` (attempt record, code snapshot, timer, reflection)
- `src/features/mistakes/` (mistake taxonomy, root causes, correction journal)
- `src/features/timers/` (timed practice engine, stopwatch, countdown)

## Key Capabilities
- Attempt logging: language used, solution code snapshot, elapsed duration, self-assessed complexity
- Structured reflection: "What pattern was required?", "What edge case was missed?"
- First-class mistake classification:
  - Logic error
  - Time complexity overshoot
  - Space complexity overshoot
  - Off-by-one / boundary edge case
  - Syntax / language feature misunderstanding
- Mistake review queue: surfaces frequent failure patterns across attempts

## Invariants
- Attempts are immutable audit records; a candidate creates a new attempt rather than mutating a prior one.
- Mistake entries link to specific attempts and canonical questions.
