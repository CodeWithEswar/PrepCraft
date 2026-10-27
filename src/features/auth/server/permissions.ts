import "server-only"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"
import { logEvent } from "@/lib/observability/logger.server"

export interface AuthorizedWorkspaceContext {
  user: User
  workspace: {
    id: string
    slug: string
    name: string
    targetRole: string | null
    targetCompany: string | null
  }
  membership: {
    id: string
    role: "owner" | "admin" | "member"
    status: "active" | "invited" | "revoked"
  }
}

/**
 * Asserts the request has an active, authenticated Supabase session.
 * If unauthenticated, safely redirects to /login preserving return path.
 */
export async function requireUser(returnTo?: string): Promise<User> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    const destination = returnTo
      ? `/login?reason=unauthenticated&returnTo=${encodeURIComponent(returnTo)}`
      : "/login"
    redirect(destination)
  }

  return user
}

/**
 * Asserts the authenticated user has verified active membership in the target workspace.
 * Prevents unauthorized access across workspace boundaries.
 */
export async function requireWorkspace(workspaceSlug: string): Promise<AuthorizedWorkspaceContext> {
  const user = await requireUser(`/w/${workspaceSlug}/today`)
  const supabase = await createClient()

  // Find workspace by slug
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id, slug, name, target_role, target_company")
    .eq("slug", workspaceSlug)
    .maybeSingle()

  if (wsError || !workspace) {
    logEvent("warn", "workspace_lookup_failed", { code: "not_found" })
    redirect("/onboarding/workspace")
  }

  // Find membership
  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("id, role, status")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (memberError || !member || member.status !== "active") {
    logEvent("warn", "workspace_access_denied", { code: "forbidden" })
    redirect(`/login?reason=access_revoked&workspace=${encodeURIComponent(workspaceSlug)}`)
  }

  return {
    user,
    workspace: {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      targetRole: workspace.target_role,
      targetCompany: workspace.target_company,
    },
    membership: {
      id: member.id,
      role: member.role as AuthorizedWorkspaceContext["membership"]["role"],
      status: member.status as AuthorizedWorkspaceContext["membership"]["status"],
    },
  }
}
