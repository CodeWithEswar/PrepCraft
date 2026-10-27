# Architecture: Server-Authoritative Resumable Onboarding

## 1. System Context & Responsibilities
Onboarding sits between Authentication (Phase 05) and Workspace Execution (Phase 07+). It is responsible for transforming a freshly authenticated candidate identity into an organized workspace with initialized settings, target parameters, and a week 1 study plan.

```
Candidate Browser
       │
       ▼  (Server Actions / HTTP)
Next.js App Router (app/(onboarding)/onboarding/*)
       │
       ▼  (Server Layer: queries.ts, mutations.ts)
Domain Services (Pure TS: transition, commitment, recommendation, slug, plan)
       │
       ▼  (Database Client / Session Cookies)
Supabase PostgreSQL (System of Record)
       ├── onboarding_drafts
       ├── preparation_templates
       ├── workspaces
       ├── workspace_settings
       ├── workspace_targets
       ├── workspace_plans
       └── RPC: bootstrap_initial_workspace
```

## 2. PostgreSQL Infrastructure Choice
- **Supabase Only**: All onboarding state is managed strictly inside PostgreSQL. No Cloudflare Queues or Workers were introduced for onboarding because initial plan generation is deterministic, lightweight (<15ms compute), and does not justify asynchronous message orchestration.
- **Atomic Bootstrap Function**: Database RPC `bootstrap_initial_workspace` executes the creation of the workspace, setting, target, plan, and draft completion within a single ACID transaction. If any step fails, the entire transaction rolls back cleanly.
- **Idempotency Guarantee**: If network timeouts cause a client retry of the final creation step, `bootstrap_initial_workspace` checks whether the user already owns a workspace. If found, it returns the existing workspace ID and slug without creating duplicates.

## 3. Schema Design
- `public.onboarding_drafts`:
  - `user_id` (UUID PK, FK `auth.users`)
  - `current_stage` (`onboarding_stage_enum`)
  - `display_name`, `college_name`, `graduation_year`
  - `target_role_family`, `target_role_name`, `target_company_id`, `custom_company_name`
  - `preferred_coding_language`
  - `weekly_target_minutes`, `study_days` (text array), `default_daily_minutes`
  - `has_target_date`, `target_date`
  - `selected_template_id`, `workspace_name`
  - `is_completed`, `created_at`, `updated_at`
- `public.preparation_templates`:
  - Canonical library of prep tracks (General SDE, Amazon Bar Raiser, Google Algorithmic Excellence, Backend Distributed Systems, Full-Stack Modern Web).
- `public.workspaces`, `workspace_settings`, `workspace_targets`, `workspace_plans`:
  - Seeded production workspace model for candidate interview preparation.

## 4. Deep-Link & Navigation State Machine
State machine progression:
`welcome` ➔ `profile` ➔ `target` ➔ `language` ➔ `commitment` ➔ `target-date` ➔ `workspace` ➔ `ready`

The `canAccessStage(currentStage, requestedStage)` service function ensures candidates cannot navigate ahead to uncompleted steps. Attempting to deep-link to `/onboarding/workspace` when only at `target` redirects the user back to `/onboarding/target`. Backward navigation is freely permitted for reviewing or editing prior answers.
