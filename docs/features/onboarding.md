# Feature: Onboarding & First Workspace Configuration

## 1. Overview & Product Vision
PrepCraft Onboarding is an 8-stage, server-authoritative, resumable guided workspace configuration flow. Unlike generic onboarding forms that store progress in browser storage, PrepCraft persists every transition into PostgreSQL (`onboarding_drafts` and candidate profile).

The candidate is guided through clarifying questions that configure their target role, target company, primary coding language, weekly time commitment, and preparation horizon. Upon finishing, PrepCraft executes an atomic bootstrap transaction creating their initial workspace, target parameters, settings, and starter preparation plan before directing them to **Open Today** (`/w/[workspaceSlug]/today`).

## 2. The 8 Stages & Routing
The onboarding journey consists of eight progressive stages, each mapped to a canonical route:

| Stage # | Stage Key | Route | Step Title | Description |
|:---:|:---|:---|:---|:---|
| 1 | `welcome` | `/onboarding/welcome` | Welcome to PrepCraft | Editorial welcome, value proposition, reassurance of consistency. |
| 2 | `profile` | `/onboarding/profile` | Complete your candidate profile | Full name, college/institution, graduation year. |
| 3 | `target` | `/onboarding/target` | Define your career target | Target role family (SWE, Backend, Frontend, Full-Stack, etc.), role title, target company. |
| 4 | `language` | `/onboarding/language` | Choose your interview language | Primary coding language for live interviews and DSA practice (Java, Python, C++, etc.). |
| 5 | `commitment` | `/onboarding/commitment` | Build a schedule you can maintain | Weekly time target, study days, daily session minutes, and balanced/intense presets. |
| 6 | `target-date` | `/onboarding/target-date` | Set your preparation horizon | Target interview date with relative duration calculation or open-ended mode. |
| 7 | `workspace` | `/onboarding/workspace` | Set up your preparation workspace | Recommended curriculum template, custom workspace name preview. |
| 8 | `ready` | `/onboarding/ready` | Your workspace is ready | First week plan preview, starter recommendations, and primary action "Open Today". |

## 3. Server-Authoritative State & Invariants
- **Source of Truth**: `public.onboarding_drafts` in Supabase PostgreSQL owns all intermediate selections.
- **Deep-Link Protection**: A candidate cannot skip ahead to stage $N$ unless all preceding stages $1 \dots N-1$ have been completed or defaulted. Accessing an unearned stage redirects to their current legitimate stage.
- **Resumability**: If a user closes the browser or changes devices, logging in resumes exactly where they left off.
- **Completed Onboarding**: Once an initial workspace is bootstrapped, revisiting `/onboarding` redirects straight to `/onboarding/ready` or their active workspace.

## 4. Client / Server Architecture
- **Boundary Rule**: In strict compliance with PrepCraft architectural rules (`scripts/ci/check-architecture.mjs`), client step components (`"use client"`) NEVER import server mutations directly. Server Component route pages load data, import mutations from `@/features/onboarding/server`, and pass them to client step forms as callbacks (`onSaveAction`, `onCreateAction`).
- **Domain Services**: Pure business logic (slugification, commitment arithmetic, template recommendation, plan generation) resides in `src/features/onboarding/services/` free of Next.js server runtime dependencies, allowing 100% unit test coverage in Vitest.
