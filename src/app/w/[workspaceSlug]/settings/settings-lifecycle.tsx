"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"
import {
  ArchiveWorkspaceDialog,
  RestoreWorkspaceDialog,
  type Workspace,
  type MutationResult,
  type ArchiveWorkspaceValues,
  type RestoreWorkspaceValues,
} from "@/features/workspaces"

interface SettingsLifecycleSectionProps {
  workspace: Workspace
  canArchive: boolean
  canRestore: boolean
  archiveAction: (values: ArchiveWorkspaceValues) => Promise<MutationResult>
  restoreAction: (values: RestoreWorkspaceValues) => Promise<MutationResult>
}

export function SettingsLifecycleSection({
  workspace,
  canArchive,
  canRestore,
  archiveAction,
  restoreAction,
}: SettingsLifecycleSectionProps) {
  const router = useRouter()
  const [archiveOpen, setArchiveOpen] = React.useState(false)
  const [restoreOpen, setRestoreOpen] = React.useState(false)

  const isArchived = workspace.status === "archived"

  return (
    <>
      <Card className="border-border/70 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-semibold">Workspace Lifecycle</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Manage the operational state of this preparation workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {!isArchived ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-surface-elevated/40">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">Archive Workspace</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Removes this workspace from active navigation while preserving all attempts, history, and applications.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!canArchive}
                onClick={() => setArchiveOpen(true)}
                className="shrink-0 text-xs"
              >
                Archive workspace
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-surface-elevated/40">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">Restore Workspace</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Brings this workspace back into active status and resumes normal preparation navigation.
                </p>
              </div>
              <Button
                size="sm"
                disabled={!canRestore}
                onClick={() => setRestoreOpen(true)}
                className="shrink-0 text-xs"
              >
                Restore workspace
              </Button>
            </div>
          )}

          {/* Deletion policy notice */}
          <div className="p-3.5 rounded-xl border border-dashed border-border/80 text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <AppIcon icon="info" size="xs" />
              Deletion Policy
            </span>
            <p className="text-[11px] leading-relaxed">
              Permanent physical deletion is intentionally segregated from routine archiving to protect historical interview records and audit trails. If you require complete workspace deletion, please contact workspace support.
            </p>
          </div>
        </CardContent>
      </Card>

      <ArchiveWorkspaceDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        workspace={{ id: workspace.id, name: workspace.name }}
        onArchive={archiveAction}
        onSuccess={() => router.refresh()}
      />

      <RestoreWorkspaceDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        workspace={{ id: workspace.id, name: workspace.name }}
        onRestore={restoreAction}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
