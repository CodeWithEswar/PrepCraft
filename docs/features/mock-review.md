# Post-Session Review & Debrief Engine

## 1. Review Architecture
After session completion, raw evidence is normalized and evaluated via `mock-evaluation-v1`:
```text
Raw Session Evidence
        ↓
Evidence Normalizer
        ↓
Objective Metrics & Facets
        ↓
Decision Friction Identification
        ↓
Session Replay Generation
        ↓
Evidence Ledger Drill-Down
        ↓
Next Week Bridge Proposal
```

## 2. Seven Performance Facets
1. **Problem Solving**: Independent completion, question completion ratio.
2. **Correctness**: Objective test suite pass rate.
3. **Complexity**: Big-O analysis recorded in scratchpad or solution notes.
4. **Communication**: Only evaluated if self-reported by user. Never fabricated.
5. **Testing**: Measured by pre-submission custom test runs vs deferred post-submission failures.
6. **Speed**: Actual vs planned target duration.
7. **Confidence Calibration**: Comparison of self-rated confidence (1-5) against objective outcomes.

## 3. Trust Principles & No Fabricated Evaluator Claims
PrepCraft refuses to emit decorative composite scores like `Mock Score: 78/100` or hiring probabilities like `87% chance of passing Amazon`. The outcome is presented as an objective Evidence Profile.
