"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AppIcon } from "@/components/app-icon"
import { WorkspaceAvatar } from "./workspace-avatar"
import { WorkspaceStatusBadge } from "./workspace-status-badge"
import { ArchiveWorkspaceDialog } from "./archive-workspace-dialog"
import { RestoreWorkspaceDialog } from "./restore-workspace-dialog"
import { CreateWorkspaceDialog } from "./create-workspace-dialog"
import type { WorkspaceListItem, MutationResult } from "../types/workspace.types"
import type {
  ArchiveWorkspaceValues,
  RestoreWorkspaceValues,
  CreateWorkspaceValues,
} from "../schemas/workspace.schema"

interface WorkspaceManagementListProps {
  workspaces: WorkspaceListItem[]
  onArchive: (values: ArchiveWorkspaceValues) => Promise<MutationResult>
  onRestore: (values: RestoreWorkspaceValues) => Promise<MutationResult>
  onCreate: (values: CreateWorkspaceValues) => Promise<MutationResult<{ workspaceId: string; slug: string }>>
}

export function WorkspaceManagementList({
  workspaces: initialWorkspaces,
  onArchive,
  onRestore,
  onCreate,
}: WorkspaceManagementListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<"active" | "archived">("active")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)

  const [archiveTarget, setArchiveTarget] = React.useState<WorkspaceListItem | null>(null)
  const [restoreTarget, setRestoreTarget] = React.useState<WorkspaceListItem | null>(null)

  const filteredWorkspaces = React.useMemo(() => {
    return initialWorkspaces.filter((w) => {
      // Tab filter
      if (w.status !== activeTab) return false

      // Search filter
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const matchName = w.name.toLowerCase().includes(q)
      const matchCompany = (w.targetCompany || w.companyName || "").toLowerCase().includes(q)
      const matchRole = (w.targetRole || w.roleName || "").toLowerCase().includes(q)
      return matchName || matchCompany || matchRole
    })
  }, [initialWorkspaces, activeTab, searchQuery])

  const activeCount = initialWorkspaces.filter((w) => w.status === "active").length
  const archivedCount = initialWorkspaces.filter((w) => w.status === "archived").length

  return (
    <div className="space-y-6">
      {/* Header controls: Search & Create */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces..."
            className="pl-9 h-9 text-xs sm:text-sm bg-card/60 border-border/80"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <AppIcon icon="search" size="xs" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs"
          >
            <AppIcon icon="plus" size="xs" className="mr-1.5" />
            Create workspace
          </Button>
        </div>
      </div>

      {/* Tabs: Active vs Archived */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "active" | "archived")}
        className="w-full"
      >
        <TabsList className="bg-surface-elevated/80 border border-border/60 p-1">
          <TabsTrigger value="active" className="text-xs font-medium px-3 py-1">
            Active
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
              {activeCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="text-xs font-medium px-3 py-1">
            Archived
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
              {archivedCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredWorkspaces.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                <AppIcon icon="folder" size="md" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {searchQuery ? "No matching workspaces" : activeTab === "active" ? "No active workspaces" : "No archived workspaces"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "Try clearing your search query to see all workspaces."
                  : activeTab === "active"
                    ? "Create a workspace to start organizing your preparation target."
                    : "Archived workspaces will be listed here with all historical attempts preserved."}
              </p>
              {activeTab === "active" && !searchQuery && (
                <div className="pt-2">
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold"
                  >
                    <AppIcon icon="plus" size="xs" className="mr-1.5 text-primary" />
                    Create workspace
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden shadow-xs">
              {filteredWorkspaces.map((ws) => {
                const targetText = [ws.targetCompany || ws.companyName, ws.targetRole || ws.roleName].filter(Boolean).join(" · ") || "General Preparation"
                const weeklyHours = ws.weeklyMinutes ? Math.round(ws.weeklyMinutes / 60) : (ws.weeklyTargetMinutes ? Math.round(ws.weeklyTargetMinutes / 60) : 10)

                return (
                  <div
                    key={ws.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors"
                  >
                    {/* Identity & Target */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <WorkspaceAvatar name={ws.name} size="md" />
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/w/${ws.slug}/today`}
                            className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate"
                          >
                            {ws.name}
                          </Link>
                          <WorkspaceStatusBadge status={ws.status} />
                          {ws.role === "owner" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/80 text-muted-foreground">
                              Owner
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {targetText}
                        </p>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-4 sm:gap-6 self-stretch sm:self-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      {/* Commitment & Target Date */}
                      <div className="text-left sm:text-right space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          {ws.targetDate ? `Target: ${ws.targetDate}` : "Open-ended target"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {weeklyHours}h/week commitment
                        </p>
                      </div>

                      {/* Dropdown Menu Quick Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              aria-label={`Actions for ${ws.name}`}
                            />
                          }
                        >
                          <AppIcon icon="more-vertical" size="sm" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-card/95 border-border/80 backdrop-blur-xl">
                          <DropdownMenuItem
                            onClick={() => router.push(`/w/${ws.slug}/today`)}
                            className="text-xs cursor-pointer"
                          >
                            <AppIcon icon="arrow-right" size="xs" className="mr-2 text-primary" />
                            Open workspace
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/w/${ws.slug}/settings`)}
                            className="text-xs cursor-pointer"
                          >
                            <AppIcon icon="settings" size="xs" className="mr-2 text-muted-foreground" />
                            Workspace settings
                          </DropdownMenuItem>

                          {ws.role === "owner" && (
                            <>
                              <DropdownMenuSeparator className="bg-border/60" />
                              {ws.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() => setArchiveTarget(ws)}
                                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  <AppIcon icon="folder" size="xs" className="mr-2 text-muted-foreground" />
                                  Archive workspace
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setRestoreTarget(ws)}
                                  className="text-xs text-primary cursor-pointer"
                                >
                                  <AppIcon icon="arrow-up" size="xs" className="mr-2 text-primary" />
                                  Restore workspace
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Archive confirmation dialog */}
      {archiveTarget && (
        <ArchiveWorkspaceDialog
          open={!!archiveTarget}
          onOpenChange={(open) => !open && setArchiveTarget(null)}
          workspace={{ id: archiveTarget.id, name: archiveTarget.name }}
          onArchive={onArchive}
          onSuccess={() => {
            setArchiveTarget(null)
            router.refresh()
          }}
        />
      )}

      {/* Restore confirmation dialog */}
      {restoreTarget && (
        <RestoreWorkspaceDialog
          open={!!restoreTarget}
          onOpenChange={(open) => !open && setRestoreTarget(null)}
          workspace={{ id: restoreTarget.id, name: restoreTarget.name }}
          onRestore={onRestore}
          onSuccess={() => {
            setRestoreTarget(null)
            router.refresh()
          }}
        />
      )}

      {/* Create workspace dialog */}
      <CreateWorkspaceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreateAction={onCreate}
      />
    </div>
  )
}
