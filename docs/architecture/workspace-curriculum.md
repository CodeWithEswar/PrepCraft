# Architecture: Workspace Curriculum & Non-Destructive Progress

## Overview
A PrepCraft workspace is the tenant isolation boundary for candidate preparation. The workspace owns its curriculum state and user progress.

## Schema Partitioning
- **`workspace_curricula`**:
  - `workspace_id`: Foreign key to `workspaces(id)` on delete cascade (unique).
  - `template_id`: Pinned template reference.
  - `template_version_id`: Pinned immutable version reference.
  - `version_number`: Exact pinned version integer.
  - `status`: `'active' | 'customized' | 'archived'`.
  - `applied_at`: Timestamptz when curriculum was applied.
- **`workspace_curriculum_overrides`**:
  - Captures fine-grained user customizations (`entity_type`: track/topic/pattern, `override_type`: priority/weight/inclusion, `value`: jsonb).
  - Allows candidates to increase graph priority or exclude unneeded topics without modifying the canonical template.
- **User Progress Tables**:
  - `attempts`, `revision_schedules`, `mastery_states`, `study_sessions`.
  - Owned by `(workspace_id, user_id)`.
  - Never deleted or overwritten by template application, replacement, or upgrades.

## Idempotent Template Application
Application is executed via the security-definer stored procedure `apply_template_to_workspace(p_workspace_id, p_template_id, p_version_number)`:
- Verifies calling user is an authorized workspace member/owner.
- Resolves latest published version if version number is null.
- Updates `workspace_targets.template_id`, `template_version`, and `template_version_id`.
- Upserts `workspace_curricula`.
- Emits activity event (`template.applied` or `template.upgraded`).
- Protects against duplicate concurrent execution.
