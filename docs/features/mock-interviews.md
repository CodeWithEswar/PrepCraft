# Mock Interview & OA Simulation Engine (Phase 16)

## 1. Product Overview
PrepCraft's Mock Interview & OA Simulation Engine simulates authentic technical interview conditions without fabricating artificial evaluator feedback. It provides real-time constraint enforcement for:
- Coding (DSA) interviews
- Computer Science Fundamentals (Java, SQL, OS, Networks)
- Behavioral interviews (STAR articulation)
- Project Deep Dives (architectural trade-offs, scalability, failure debugging)
- Mixed technical rounds
- Online Assessments (OA)
- Company-template-driven practice rounds

## 2. Evidence-Driven First
PrepCraft answers two critical questions:
1. **Can I perform under realistic interview constraints?**
2. **What actually happened under time pressure?**

To maintain absolute user trust, PrepCraft categorizes all session telemetry into three distinct evidence classes:
- `OBSERVED`: Objectively measured facts (e.g., solved 2 of 3 questions, ran code 3 times, spent 11 minutes before first code execution).
- `SELF_REPORTED`: Explicit inputs from the user (e.g., self-rated confidence, post-session communication reflection).
- `AUTOMATED_INFERENCE`: Deterministic rule-based insights (e.g., deferred edge-case validation suggested by test runner failures).

PrepCraft never claims communication was poor or strong unless communication evidence was explicitly captured. Missing dimensions remain explicitly labeled as `"Not evaluated"`.

## 3. Architecture & Engine Reuse
The Simulation Engine strictly reuses Phase 11's timestamp-authoritative **Execution Engine** (`execution_sessions`). No duplicate `mock_timer` or `oa_timer` exists. Sessions are snapshot with their effective `SimulationPolicy`, ensuring historical sessions remain reproducible.

## 4. Navigation & Routes
- Mock Lobby & Composer: `/w/[workspaceSlug]/interview/mocks`
- Interactive Chamber: `/w/[workspaceSlug]/interview/mocks/[sessionId]`
- Debrief & Evidence Review: `/w/[workspaceSlug]/interview/mocks/[sessionId]/review`
- Interactive Design Preview: `/preview/mocks`
