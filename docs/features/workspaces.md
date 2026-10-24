# Feature: Workspaces

## Purpose
Provides the fundamental tenant boundary for candidate preparation, data isolation, and configuration settings.

## Ownership
- `src/features/workspaces/`
- Target route: `src/app/(workspace)/w/[workspaceSlug]/settings/`

## Key Capabilities
- Workspace creation, slug generation, and unique constraint enforcement
- Workspace membership and role assignment (Owner, Member)
- Workspace settings (theme preferences, preparation targets, deadline management)
- Context resolver mapping URL slugs to verified database workspace IDs

## Invariants
- All data tables reference `workspace_id`.
- Workspace slugs must be URL-safe and unique per workspace.
- RLS unconditionally scopes queries by `workspace_id`.
