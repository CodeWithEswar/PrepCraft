import type {
  WorkspaceMembership,
  WorkspacePermissions,
  WorkspaceStatus,
} from "../types/workspace.types"

/**
 * Resolves permissions for a user within a workspace context.
 * Enforces:
 * - Disabled or non-active memberships receive zero mutation permissions.
 * - Archived workspaces disable editing until restored.
 * - Owners have full administrative, target, scheduling, and lifecycle rights.
 * - Members can view and practice, but cannot alter targets or archive workspaces.
 */
export function resolveWorkspacePermissions(
  membership: WorkspaceMembership | null,
  workspaceStatus: WorkspaceStatus
): WorkspacePermissions {
  if (!membership || membership.status !== "active") {
    return {
      canView: false,
      canEditSettings: false,
      canEditTarget: false,
      canEditSchedule: false,
      canArchive: false,
      canRestore: false,
      canManageMembers: false,
      canDelete: false,
    }
  }

  const isOwner = membership.role === "owner" || membership.role === "admin"
  const isArchived = workspaceStatus === "archived"

  return {
    canView: true,
    canEditSettings: isOwner && !isArchived,
    canEditTarget: isOwner && !isArchived,
    canEditSchedule: isOwner && !isArchived,
    canArchive: isOwner && !isArchived,
    canRestore: isOwner && isArchived,
    canManageMembers: isOwner && !isArchived,
    canDelete: isOwner,
  }
}
