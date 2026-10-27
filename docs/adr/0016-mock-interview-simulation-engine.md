# ADR 0016: Realistic Mock Interview & OA Simulation Engine

## Status
Accepted

## Context
PrepCraft needed an explicit Phase 16 module for Mock Interviews and Online Assessment (OA) simulations. Previous discussions considered AI interviewers, voice evaluation, or building independent timer mechanisms. However:
1. Fabricating evaluator feedback (e.g., claiming to evaluate spoken communication without recording audio) destroys user trust.
2. Building a separate timer engine would cause clock drift, duplicate state, and race conditions with Phase 11's Execution Engine.
3. Silently scheduling follow-up tasks in the user's study calendar undermines user ownership.

## Decision
1. **Reuse Execution Engine**: Mock sessions directly reference `execution_sessions` and use monotonic, timestamp-authoritative timing. No independent `mock_timer` is created.
2. **Three Evidence Classes**: All telemetry is strictly categorized as `OBSERVED`, `SELF_REPORTED`, or `AUTOMATED_INFERENCE`.
3. **No Fabricated Feedback**: Missing dimensions (e.g., communication when no speech is captured) remain explicitly labeled as `"Not evaluated"`.
4. **No Arbitrary Composite Scores**: Results are presented as evidence-grounded performance facets rather than decorative 78/100 gauges or hiring probabilities.
5. **Next Week Bridge Ownership**: The Mock Engine proposes follow-up tasks, but the Planning Engine owns calendar scheduling; tasks are added only upon explicit user confirmation.
6. **Server-Authoritative Expiration**: The browser never extends an expired session; `now() >= expires_at` is enforced transactionally on the server.

## Consequences
- Authentic preparation environment under realistic pressure.
- Uncompromising trust and auditability.
- Clear domain boundaries across Execution, Mastery, Revision, and Planning.
