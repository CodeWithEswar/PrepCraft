# ADR 0009: Workspace Isolation Boundary & Separation of Preparation Target from Scheduling Preferences

## Status
Accepted

## Date
2026-10-24

## Context
PrepCraft serves candidates preparing for multiple concurrent interview goals (e.g., "Amazon SDE I", "TCS Prime", "General ₹10+ LPA SDE"). Previously, early migrations placed scheduling parameters (`daily_minutes_target`, `weekly_minutes_target`, `study_days`) directly within `workspace_targets`. Furthermore, workspace authorization risked drifting between `owner_user_id` on the workspace table and `workspace_members`.

Without strict isolation:
1. Progress, attempts, and revision schedules from one company preparation could bleed into another.
2. `workspace_targets` was turning into a catch-all configuration table combining long-term career aspirations with daily time-management preferences.
3. Target date re-calibrations risked rewriting historical progress or mutating daily scheduling contracts.

## Decisions

### 1. The Workspace is the Primary Preparation Isolation Boundary
- Account = Person; Workspace = Preparation Goal; Target = What the workspace prepares toward; Template = Recommended structure; Progress = User-owned workspace state.
- All workspace-scoped domain records carry or derive `workspace_id`.
- Dual-layer authorization is mandatory: Server-First Authorization in Next.js Server Components (`resolveWorkspace`) paired with PostgreSQL Row-Level Security (`is_workspace_member`, `is_workspace_owner`).

### 2. Separation of Target from Scheduling Preferences
- `workspace_targets` strictly owns *what* the candidate prepares for: `company_id`, `custom_company_name`, `role_id`, `role_name`, `custom_role_name`, `target_date`, `preparation_level`, `interview_language`, and `template_id`.
- `workspace_preferences` owns *how* the candidate prepares: `weekly_target_minutes`, `default_daily_minutes`, `study_days`, and `planning_mode`.
- Changing a target date or role updates future planning pressures without mutating time-budget preferences or rewriting historical attempts.

### 3. Clear Ownership & Lifecycle States
- Authorization representation of ownership is modelled via `workspace_members` with `role = 'owner'` and `status = 'active'`.
- `created_by_user_id` on `workspaces` is preserved for provenance.
- Workspace lifecycle follows an explicit state machine: `ACTIVE <-> ARCHIVED`.
- Archiving preserves 100% of preparation history, attempts, analytics, and applications while removing the workspace from ordinary navigation. Physical deletion is decoupled as an explicitly destructive administrative operation.

### 4. Authoritative State Remains in PostgreSQL
- No Cloudflare infrastructure or edge key-value mirrors are introduced for workspace CRUD. PostgreSQL with Supabase Auth remains the single authoritative system of record.

## Consequences
- Clean, unpolluted data models that allow the subsequent Today, Planning, DSA Execution, and Recovery systems to consume isolated workspace context cleanly.
- Guaranteed cache isolation in TanStack Query (`["workspaces", workspaceId, ...]`), eliminating cross-workspace data flash during switching.
- High testability: 100% test pass rate across SQL schema, permissions, avatar generation, target impact calculation, and workspace switching.
