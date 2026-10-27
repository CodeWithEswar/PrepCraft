import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { WorkspaceMembership } from "../types/workspace.types"

export interface VerifiedMembershipResult {
  isMember: boolean
  isOwner: boolean
  membership: WorkspaceMembership | null
  error?: string
}

/**
 * Server authorization check verifying user's active membership in a workspace.
 * Never trust a client-supplied workspace ID without executing this verification.
 */
export async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string,
  requiredRole: "member" | "owner" = "member"
): Promise<VerifiedMembershipResult> {
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, user_id, role, status, joined_at, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle()

  if (error || !member) {
    return {
      isMember: false,
      isOwner: false,
      membership: null,
      error: "User is not an active member of this workspace.",
    }
  }

  const typedMembership: WorkspaceMembership = {
    id: member.id,
    workspaceId: member.workspace_id,
    userId: member.user_id,
    role: member.role as WorkspaceMembership["role"],
    status: member.status as WorkspaceMembership["status"],
    joinedAt: member.joined_at,
    createdAt: member.created_at,
    updatedAt: member.updated_at,
  }

  const isOwner = member.role === "owner" || member.role === "admin"

  if (requiredRole === "owner" && !isOwner) {
    return {
      isMember: true,
      isOwner: false,
      membership: typedMembership,
      error: "This operation requires workspace owner privileges.",
    }
  }

  return {
    isMember: true,
    isOwner,
    membership: typedMembership,
  }
}
