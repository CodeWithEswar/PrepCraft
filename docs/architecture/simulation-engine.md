# Architecture: Simulation Engine

## 1. Domain Boundary
The Simulation Engine provides runtime constraints and evidence collection. It does NOT own:
- Question content (owned by DSA, Fundamentals, Behavioral, Project libraries)
- Authoritative session timing (owned by Phase 11 `execution_sessions`)
- Long-term weakness interpretation (owned by Mastery Engine)
- Spaced repetition scheduling (owned by Revision Engine)
- Calendar allocations (owned by Planning Engine)

## 2. Execution Flow
```text
PREPARATION TEMPLATE
        │
        ▼
SESSION BLUEPRINT
        │
        ▼
SIMULATION POLICY
        │
        ▼
EXECUTION ENGINE (Authoritative Timing)
        │
        ▼
MOCK / OA SESSION
        │
        ├───────────┬────────────┬────────────┐
        ▼           ▼            ▼            ▼
     CODING      CS FUND.    BEHAVIORAL    PROJECT
        │           │            │            │
        └───────────┴──────┬─────┴────────────┘
                           ▼
                    SESSION EVIDENCE
                           │
                           ▼
                     REVIEW ENGINE
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          STRENGTHS     WEAKNESSES   EVIDENCE GAPS
              │            │            │
              └────────────┼────────────┘
                           ▼
                       NEXT ACTION
                           │
             ┌─────────────┼──────────────┐
             ▼             ▼              ▼
          MASTERY       REVISION       PLANNING
                                           │
                                           ▼
                                         TODAY
```
