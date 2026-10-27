# ADR 0010: Versioned Preparation Templates & Published Immutability

## Context
Preparation curricula for top engineering companies and roles evolve over time (e.g., changes in interview round weights, inclusion of modern system design expectations, or shifts in DSA pattern emphasis). In a naive implementation, templates are updated in place or stored as mutable JSON presets. If a template is altered while a candidate is in the middle of a 3-month preparation journey, their assigned topics, planning allocations, and milestones would silently mutate without their consent or knowledge.

## Decision
1. **Preparation Templates have stable identity (`preparation_templates`), while curriculum structure is captured in immutable versions (`preparation_template_versions`)**:
   - `preparation_templates` owns identity, company/role targeting, slug, type, and visibility.
   - `preparation_template_versions` owns version number, status (`draft`, `review`, `published`, `deprecated`, `archived`), change summary, and publication timestamps.
2. **Published Template Versions are Immutable**:
   - Once a template version is marked as `published`, its associated tracks, topics, patterns, and stages cannot be mutated in place.
   - To revise a curriculum, an internal curator creates a new draft version (e.g., `v2`), authors changes, validates invariants, and publishes the new version.
3. **Historical Reproducibility**:
   - Workspaces pin to a specific `version_number` and `template_version_id`. Historical preparation plans and curriculum structures remain 100% reproducible over time.

## Consequences
- **Positive**: Complete auditability, zero surprise regressions for active learners, predictable upgrade path with diff inspection.
- **Negative**: Requires version management tables and explicit migration workflows rather than simple row updates.
