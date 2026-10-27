# Feature: Workspaces, Membership & Lifecycle

## 1. Overview & Product Principles
In PrepCraft, a **Workspace** is the primary preparation isolation boundary. It embodies a candidate's distinct preparation goal.

```text
Account = Person
  │
  ├── Amazon SDE I (Workspace)
  │     ├── Java · Amazon SDE Template · Target: Dec 2026
  │     └── Independent progress, attempts, revisions, mastery
  │
  ├── TCS Prime (Workspace)
  │     ├── Java · TCS Template
  │     └── Independent progress
  │
  └── General ₹10+ LPA SDE (Workspace)
        ├── Java · General Template
        └── Independent progress
```

Progress from one workspace never leaks into another.

## 2. Workspace Domain Model
A workspace is defined by clear domain separation:
1. **Workspace Identity (`workspaces`)**:
   - `id`: UUID primary key
   - `name`: Human-readable goal title
   - `slug`: URL-safe routing slug (`/w/[workspaceSlug]`)
   - `status`: Lifecycle state (`active` | `archived`)
   - `timezone`: IANA timezone string (e.g. `Asia/Kolkata`, `America/New_York`, `Europe/London`)
   - `created_by_user_id`: Provenance identity
   - `created_at`, `updated_at`, `archived_at`

2. **Workspace Membership (`workspace_members`)**:
   - `workspace_id`, `user_id`: Composite unique constraint
   - `role`: Authorization representation (`owner` | `member`)
   - `status`: Lifecycle state (`active` | `invited` | `disabled` | `revoked`)
   - Access requires `status = 'active'`.

3. **Workspace Target (`workspace_targets`)**:
   - What the workspace is preparing toward (Company, Role, Target Date, Level, Language, Template).

4. **Workspace Preferences (`workspace_preferences`)**:
   - How the candidate intends to prepare (Weekly target minutes, typical daily minutes, active study days, planning mode).

## 3. Workspace Lifecycle
PrepCraft enforces an explicit state machine:
```text
ACTIVE ──(Archive Workspace)──> ARCHIVED ──(Restore Workspace)──> ACTIVE
```

- **Archiving**:
  - Preserves 100% of preparation history, attempts, revision items, analytics, and applications.
  - Removes the workspace from ordinary active switcher navigation.
  - Pauses new scheduled daily task generation.
  - Requires explicit confirmation via an `AlertDialog` with clear copy (no `window.confirm`).
- **Restoration**:
  - Returns status to `active`.
  - Re-enables navigation and planning.
  - Emits `workspace.restored` activity event.
- **Physical Deletion**:
  - Distinct destructive lifecycle operation reserved for complete data purging with dedicated recovery considerations. Not combined with archive.

## 4. Switching & Cache Isolation
When switching between workspaces:
1. Target membership is verified server-side.
2. The switcher resolves the destination path (preserving section where applicable, e.g. `/w/old/settings` -> `/w/new/settings`).
3. Old workspace query cache entries (`["workspaces", oldWorkspaceId, ...]`) are cancelled and invalidated to prevent cross-workspace data flash.
4. `profiles.last_active_workspace_id` is updated as a convenience preference.
