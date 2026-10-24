# Feature: Mastery & Readiness Evaluation

## Purpose
Evaluates candidate evidence across multiple dimensions and computes objective readiness against target goals.

## Ownership
- `src/features/mastery/` (algorithmic topic evidence calculation)
- `src/features/readiness/` (target criteria comparison & readiness signals)
- Target route: `src/app/(workspace)/w/[workspaceSlug]/progress/`

## Key Capabilities
- Dimension-based mastery scoring:
  - DSA & Problem Solving
  - CS Fundamentals & Language Internals
  - System Design & Trade-offs
  - Behavioral & Communication
- Evidence-based metrics: solves, retention rates, mistake frequencies, timed attempt consistency
- Readiness convergence: highlights unaddressed gaps relative to an upcoming interview date

## Invariants
- Readiness is an objective signal of preparation evidence, never a vanity completion percentage or guarantee of an offer.
- Mastery calculation is derived from historical attempt records and does not overwrite primary operational state.
