# Architecture: Preparation Template Versioning & Immutability

## Problem Statement
When a curriculum curator refines track priorities or introduces new topics for a target company (e.g. Amazon SDE adding distributed caching or updated Leadership Principles), workspaces actively preparing for that company must not experience silent, uncontrolled shifts in their milestones.

## Domain Model
```text
preparation_templates (id, slug, name, company_id, role_id, template_type, status, visibility, current_published_version_id)
        │
        ├── v1 (preparation_template_versions: status='published')
        │       ├── template_version_tracks
        │       ├── template_version_topics
        │       ├── template_version_patterns
        │       ├── template_interview_stages
        │       └── template_readiness_requirements
        │
        └── v2 (preparation_template_versions: status='published')
                └── [Refined curriculum definitions]
```

## Immutability Invariant
Once a template version reaches `status = 'published'`, its database rows are immutable:
- No in-place editing of track weights or topic priorities.
- Modifying curriculum requires creating a draft version (`version_number = N + 1`), editing within the draft lifecycle, validating invariants via `validateTemplateIntegrity()`, and publishing via a transactional workflow.

## Workspace Upgrades & Diff Engine
1. Workspaces pin to `template_version_id` and `version_number`.
2. When `latest_published_version > workspace.version_number`, an upgrade is detected.
3. The `computeCurriculumDiff()` engine computes:
   - Added tracks and topics (`+`)
   - Removed tracks and topics (`-`)
   - Priority shifts (`~` Old → New)
   - Planning weight shifts
4. The user reviews the diff and explicitly confirms the upgrade.
5. All historical question attempts, session logs, revision intervals, and mastery evidence remain permanently intact.
