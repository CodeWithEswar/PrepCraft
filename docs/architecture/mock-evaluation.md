# Architecture: Mock Evaluation Policy (`mock-evaluation-v1`)

## 1. Centralized Rules
All evaluation logic is encapsulated within `src/features/mock-interviews/policies/evaluation-policy-v1.ts`. No evaluation heuristics or score multipliers are embedded inside React components.

## 2. Evaluation Lifecycle
1. Session is finalized by user submit or server expiration.
2. Raw session events, attempts, code runs, and answer states are normalized into `RawSessionEvidence`.
3. `evaluateSessionFacets` computes status, confidence, provenance, and ledger points for each of the 7 dimensions.
4. `primaryFinding` identifies the single most actionable observed behavior (e.g. "Testing Under Time Pressure").
5. `whatHeldUp` surfaces verified strengths to avoid purely punitive reviews.
6. `nextWeekBridge` formats concrete follow-up suggestions for user review before Planning scheduling.
