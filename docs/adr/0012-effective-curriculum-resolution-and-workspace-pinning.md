# ADR 0012: Effective Curriculum Resolution, Version Pinning, and Safe Overrides

## Context
When applying a preparation template to a workspace, there are two common architectural patterns:
1. **Dynamic Resolution on Every Request**: Compute the effective curriculum at read-time directly from canonical template tables.
   - *Risk*: A future update to the template silently alters an existing workspace's curriculum without user awareness or consent.
2. **Materialized Snapshot**: Copy all curriculum rows (tracks, topics, patterns, questions) into workspace-specific tables at application time.
   - *Risk*: Heavy row duplication, high database bloat, and difficulty computing diffs against newer template versions.

## Decision
PrepCraft adopts a hybrid **Version-Pinned Effective Curriculum with Explicit Overrides**:
1. **Version Pinning**:
   - `workspace_curricula` pins to `template_id`, `template_version_id`, and `version_number`.
   - The canonical curriculum definitions remain stored in `template_version_tracks`, `template_version_topics`, and `template_version_patterns` under that immutable version ID.
2. **Dynamic Composition with Context**:
   - The `CurriculumResolver` composes the effective workspace curriculum using:
     `Pinned Template Version + Target Language + Workspace Overrides`
   - Language tracks adapt dynamically (e.g., if interview language is `Java`, the programming language track resolves to Java-specific topic recommendations and notes).
3. **Workspace-Level Overrides (`workspace_curriculum_overrides`)**:
   - Users can tailor priorities, adjust weights, or exclude specific topics/tracks for their unique preparation journey.
   - Overrides are stored in a typed relational table (`workspace_id`, `entity_type`, `entity_id`, `override_type`, `value`).
   - Overrides never mutate the canonical template.
   - The UI clearly distinguishes `Template recommended` vs `User modified`.
4. **Controlled Template Upgrades**:
   - When a newer version is published (e.g. `v1 -> v2`), the workspace is not silently migrated.
   - An "Update Available" banner is presented.
   - The user inspects a structural diff (`+` additions, `~` priority shifts, `-` removals).
   - Upon confirmation, `apply_template_to_workspace` is called to pin the workspace to the new version in a safe, idempotent database transaction.

## Consequences
- **Positive**: Zero data duplication of thousands of canonical topics; complete version stability; fully reproducible curriculum; safe user tailoring with clear provenance.
- **Negative**: Requires a deterministic resolver layer when presenting effective curriculum.
