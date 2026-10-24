# PrepCraft Engineering & Product Roadmap

The development sequence follows strict architectural dependencies. Earlier phases establish the foundations for subsequent modules:

```text
Phase 01: Foundation & Dependency Baseline (Complete)
Phase 02: Brand System & Marketing Preview (Complete)
Phase 03: Repository Architecture & Feature Boundaries (Current)
   │
   ▼
Phase 04: Authentication & Identity (Supabase SSR, Google OAuth, Session Architecture)
   │
   ▼
Phase 05: Workspace & Onboarding (Workspace Slug Resolution, Targets, Membership)
   │
   ▼
Phase 06: Planning & Today Command Center (Daily Plan Engine, Rebalancing, Today Dashboard)
   │
   ▼
Phase 07: Questions, Attempts & Practice Studio (Canonical Catalog, Workspace Questions, Timers)
   │
   ▼
Phase 08: Isolated Code Execution Sandbox (Secure External Runner, Safety Boundaries)
   │
   ▼
Phase 09: Mistakes, Patterns, Revision & Mastery (Root Cause Classification, Spaced Repetition)
   │
   ▼
Phase 10: Study Tools (Flashcards, Quick Cheat-Sheets, Revision Cards)
   │
   ▼
Phase 11: Real Interview Tracking & Journal (OA Tracking, Technical Rounds, Behavioral Matrix)
   │
   ▼
Phase 12: Application Pipeline & Offer Evaluation (Kanban, Resume Association, Deadlines)
   │
   ▼
Phase 13: Platform Hardening & PWA (Offline Sync, Push Notifications, Performance Audit)
```

## Non-Goals & Boundaries
- **No AI Mock Interviews**: PrepCraft will not introduce synthetic conversational video or audio mock interviewers.
- **No Client-Side Code Execution**: Candidate code execution is quarantined to dedicated sandboxes in Phase 08.
- **No Competing Databases**: Supabase PostgreSQL is the sole system of record; Cloudflare handles asynchronous/edge execution.
