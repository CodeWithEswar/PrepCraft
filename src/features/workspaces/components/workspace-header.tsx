"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { WorkspaceSelectorMobile } from "./workspace-selector-mobile"
import type { WorkspaceListItem, MutationResult } from "../types/workspace.types"
import type { CreateWorkspaceValues } from "../schemas/workspace.schema"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface WorkspaceHeaderProps {
  currentWorkspace: {
    id: string
    name: string
    slug: string
    targetRole?: string | null
    targetCompany?: string | null
  }
  workspaces: WorkspaceListItem[]
  onSwitchAction?: (workspaceId: string) => Promise<MutationResult>
  onCreateAction?: (values: CreateWorkspaceValues) => Promise<MutationResult<{ workspaceId: string; slug: string }>>
}

export function WorkspaceHeader({
  currentWorkspace,
  workspaces,
  onSwitchAction,
  onCreateAction,
}: WorkspaceHeaderProps) {
  const pathname = usePathname()

  // Extract section name (today, settings, etc.)
  const section = pathname.split("/")[3] || "today"
  const formattedSection = section.charAt(0).toUpperCase() + section.slice(1)

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Mobile branding / Desktop Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center">
            <WorkspaceSelectorMobile
              currentWorkspace={currentWorkspace}
              workspaces={workspaces}
              onSwitchAction={onSwitchAction}
              onCreateAction={onCreateAction}
            />
          </div>

          <div className="hidden md:flex items-center">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <Link href={`/w/${currentWorkspace.slug}/today`} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                        {currentWorkspace.name}
                      </Link>
                    }
                  />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs font-semibold text-foreground">
                    {formattedSection}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Right: Quick actions / Settings link */}
        <div className="flex items-center gap-2">
          <Link
            href={`/w/${currentWorkspace.slug}/settings`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted/60"
          >
            Settings
          </Link>
        </div>
      </div>
    </header>
  )
}
