# PrepCraft — Curriculum Composition & Resolution
Phase 08: Domain Specification

## Architecture Model
PrepCraft implements a strict multi-tier separation between canonical domain concepts, template recommendations, and effective workspace preparation:

```text
Canonical Catalog (Tracks, Topics, Patterns, Questions)
      │
      ▼
Preparation Template (Identity, Company/Role Targeting)
      │
      ▼
Template Version (Immutable Definition, Priorities, Weights, Stages)
      │
      ▼
Curriculum Resolver (Language Adaptation + Workspace Overrides)
      │
      ▼
Effective Workspace Curriculum (Pinned Version, Planning Allocation)
      │
      ▼
User Progress (Attempts, Mistake Journal, Spaced Revision, Mastery)
```

## Curriculum Granularity
- **Tracks**: High-level preparation domains (`DSA`, `Programming Language`, `CS Fundamentals`, `SQL / Databases`, `System Design`, `Projects`, `Behavioral`, `Timed Practice`).
- **Topics**: Concrete technical subject areas belonging to a track (e.g. `Arrays & Strings`, `Binary Trees`, `Dynamic Programming`, `Concurrency & Threading`).
- **Patterns**: First-class algorithmic and problem-solving patterns (e.g. `Two Pointers`, `Sliding Window`, `Monotonic Stack`, `Topological Sort`).
- **Stages**: Expected interview rounds (`Online Assessment`, `Technical Coding`, `System Design`, `Behavioral & Principles`).
- **Readiness Requirements**: Measurable evidence expectations across key dimensions.

## Planning Allocations
Each track in a template defines a non-negative integer `weight`. The `CurriculumResolver` automatically normalizes these weights into planning allocation percentages that sum to 100%. These percentages inform downstream weekly and daily study plan generation.
