# ADR 0008: Server-Authoritative Resumable Onboarding Architecture

## Status
Accepted

## Context
Candidates configuring their preparation parameters in PrepCraft provide high-value intent: their educational background, target company, role level, coding language preference, and weekly bandwidth schedule. 

Common onboarding flows in web applications store multi-step draft progress inside `localStorage` or client session memory until the final step. However:
1. `localStorage` is device-bound; if a candidate begins on mobile and switches to desktop (or uses an incognito window), their configuration is lost.
2. Client-only state is invisible to server telemetry and drop-off analytics.
3. Complex multi-step wizards without server enforcement are vulnerable to invalid deep-linking (e.g. attempting to jump straight to the workspace creation step without valid target data).
4. Creating the workspace across several separate REST calls risks orphaned or partial entities if a client disconnects midway.

## Decision
1. **PostgreSQL as Single Source of Truth**:
   All onboarding state is stored in a dedicated `onboarding_drafts` table in Supabase PostgreSQL keyed by `user_id`. Each step submission updates PostgreSQL via a Next.js Server Action and advances the server-recorded stage.
2. **Deep-Link State Guard**:
   Route pages use `requireOnboardingStage(stage)` on the server to check whether the candidate is authorized to access the requested stage based on `canAccessStage(currentStage, requestedStage)`. Skipping ahead redirects candidates to their furthest legitimate stage. Backward navigation remains fully supported for editing prior choices.
3. **Pure Domain Services**:
   Business logic (state machine transitions, commitment arithmetic, canonical template matching, slugification, and deterministic week 1 plan generation) is separated into pure TypeScript functions in `src/features/onboarding/services/` with zero Next.js runtime or server dependencies.
4. **Decoupled Client/Server Boundaries**:
   In compliance with `scripts/ci/check-architecture.mjs`, Client Components (`"use client"`) never directly import `@/features/onboarding/server/*`. Server Component route wrappers load data and pass server mutations as callback props.
5. **Atomic Workspace Creation via Database RPC**:
   The transition from onboarding draft to active workspace is executed inside an atomic PostgreSQL function (`bootstrap_initial_workspace`). It creates the workspace, workspace settings, workspace target, and week 1 preparation plan, and marks the onboarding draft complete in a single transaction. Idempotency guards prevent duplicate workspaces upon client retry.
6. **No Premature Cloudflare Queues for Onboarding**:
   Cloudflare Queues/Workers are reserved for heavy, asynchronous AI work in later phases. Generating the initial week 1 study plan is fast and deterministic (<15ms), so PostgreSQL handles the bootstrap synchronously without introducing distributed complexity.

## Consequences
- **Positive**: 100% resumable across devices and browser sessions; zero orphan workspaces; protected deep-links; 100% testable domain services; atomic rollback on database failure.
- **Negative**: Every step transition incurs a quick round-trip to PostgreSQL, requiring responsive optimistic UI transitions and network error handling in step forms.
