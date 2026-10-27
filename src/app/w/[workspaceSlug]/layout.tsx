import * as React from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspace, getUserWorkspaces } from "@/features/workspaces/server"
import { WorkspaceShell } from "@/features/workspaces"
import { getUserProfile, signOutAction } from "@/features/auth/server"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { AppIcon } from "@/components/app-icon"
import "@/components/shell/shell.css"
import "@/features/today/dashboard.css"
import "@/features/today/today.css"
import "@/features/today/today-reference.css"
import "@/features/planning/planning.css"
import "@/features/execution/execution.css"
import "@/features/revision/revision.css"
import "@/features/mastery/mastery.css"

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: Promise<{
    workspaceSlug: string
  }>
}

export const instant = false

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  await connection()
  const { workspaceSlug } = await params

  // 1. Resolve workspace and verify server-side authorization
  const context = await resolveWorkspace(workspaceSlug)

  if (!context) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect(`/login?returnTo=/w/${workspaceSlug}/today`)
    }

    // Authenticated but workspace not found or user lacks active membership
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-background text-foreground">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl border border-border/80 bg-card/85 text-center space-y-4 shadow-xl backdrop-blur-xl">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
            <AppIcon icon="lock" size="lg" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Workspace Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            You don&apos;t have access to this preparation workspace, or the workspace does not exist.
          </p>
          <div className="pt-2">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to my workspaces
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. Load all accessible workspaces for the switcher
  const [allWorkspaces, profile] = await Promise.all([getUserWorkspaces(), getUserProfile(context.membership.userId)])

  const currentWorkspaceInfo = {
    userId: context.membership.userId,
    id: context.workspace.id,
    name: context.workspace.name,
    slug: context.workspace.slug,
    targetRole: context.target?.roleName,
    targetCompany: context.target?.companyName || context.target?.customCompanyName,
  }

  return <WorkspaceShell currentWorkspace={currentWorkspaceInfo} workspaces={allWorkspaces} userName={profile?.displayName || "You"} archived={context.workspace.status === "archived"} profileAction={<form action={signOutAction} className="w-full"><DropdownMenuItem variant="destructive" nativeButton render={<button type="submit" className="w-full text-left"/>}><AppIcon icon="exit" size={15}/><span>Sign out</span></DropdownMenuItem></form>}>
    {children}
  </WorkspaceShell>
}
