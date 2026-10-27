# ADR 0011: Templates Recommend Preparation; Workspaces Own Preparation; Users Own Progress

## Context
A recurring failure mode in multi-tenant SaaS educational platforms is coupling user progress, question attempts, revision states, or mastery metrics directly to curriculum templates (e.g., storing a `completed_topics` JSON array on a template, or associating a solved question attempt with `template_id`). When a template is updated, deleted, or switched, user history is either corrupted, deleted, or left in an inconsistent state.

## Decision
1. **Strict Four-Tier Boundary**:
   - **Tier 1: Canonical Catalog**: `tracks`, `topics`, `patterns`, `questions`. Shared, reusable knowledge definitions.
   - **Tier 2: Preparation Templates & Versions**: Recommendations and guidance (`template_version_tracks`, `template_version_topics`, `template_interview_stages`). Canonical recommendations only. Zero user-state or workspace-state columns.
   - **Tier 3: Workspace Curriculum**: Workspace-specific materialized preparation boundaries (`workspace_curricula`, `workspace_curriculum_overrides`). Pinned to `template_id` and `version_number`.
   - **Tier 4: User Progress**: Attempts, mistake journals, spaced repetition intervals, study sessions, and mastery evidence. Owned strictly by user/workspace tables.
2. **Non-Destructive Template Replacement & Upgrades**:
   - When a workspace switches templates or upgrades versions, **historical user progress is never deleted**.
   - If a topic is removed from the newly applied template, past problem attempts and revision history for that topic remain intact and are preserved as historical evidence.

## Consequences
- **Positive**: Candidate progress is permanent, trustworthy, and safely auditable. Switching targets (e.g., from General SWE to Amazon SDE) preserves all completed DSA practice.
- **Negative**: Requires independent query joining across workspace and curriculum boundaries.
