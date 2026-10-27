import * as React from "react"
import {
  getUserWorkspaces,
  archiveWorkspaceAction,
  restoreWorkspaceAction,
  createWorkspaceAction,
} from "@/features/workspaces/server"
import { WorkspaceManagementList } from "@/features/workspaces"

export const instant = false

export default async function WorkspacesSettingsPage() {
  const workspaces = await getUserWorkspaces()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Workspaces
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage your preparation goals and their targets.
        </p>
      </div>

      {/* Management List */}
      <WorkspaceManagementList
        workspaces={workspaces}
        onArchive={archiveWorkspaceAction}
        onRestore={restoreWorkspaceAction}
        onCreate={createWorkspaceAction}
      />
    </div>
  )
}
