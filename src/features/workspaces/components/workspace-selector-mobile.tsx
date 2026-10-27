"use client"
import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppIcon } from "@/components/app-icon"
import { WorkspaceAvatar } from "./workspace-avatar"
import { resolveWorkspaceSwitchDestination, workspaceQueryKeys } from "../services/workspace-switch"
import type { WorkspaceListItem, MutationResult } from "../types/workspace.types"
import { CreateWorkspaceDialog } from "./create-workspace-dialog"
import type { CreateWorkspaceValues } from "../schemas/workspace.schema"
import { switchWorkspaceAction, createWorkspaceAction } from "../server/mutations"
import Link from "next/link"
import { cn } from "cn"

interface WorkspaceSelectorMobileProps {
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

export function WorkspaceSelectorMobile({
  currentWorkspace,
  workspaces,
  onSwitchAction,
  onCreateAction,
}: WorkspaceSelectorMobileProps) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [isSwitching, startTransition] = React.useTransition()
  const createFn = onCreateAction || createWorkspaceAction
  const switchFn = onSwitchAction || switchWorkspaceAction

  const filteredWorkspaces = workspaces.filter((ws) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      ws.name.toLowerCase().includes(q) ||
      (ws.targetCompany && ws.targetCompany.toLowerCase().includes(q)) ||
      (ws.targetRole && ws.targetRole.toLowerCase().includes(q))
    )
  })

  const handleSelect = (targetWs: WorkspaceListItem) => {
    if (targetWs.id === currentWorkspace.id) {
      setOpen(false)
      return
    }

    startTransition(async () => {
      queryClient.cancelQueries({ queryKey: workspaceQueryKeys.workspace(currentWorkspace.id) })
      queryClient.removeQueries({ queryKey: workspaceQueryKeys.workspace(currentWorkspace.id) })

      await switchFn(targetWs.id)

      setOpen(false)
      const destination = resolveWorkspaceSwitchDestination(pathname, targetWs.slug)
      router.push(destination)
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 px-2.5 h-9 rounded-xl border border-border/50 bg-surface-elevated/40"
            />
          }
        >
          <WorkspaceAvatar name={currentWorkspace.name} id={currentWorkspace.id} size="sm" />
          <span className="text-xs font-semibold truncate max-w-[120px]">{currentWorkspace.name}</span>
          <AppIcon icon="arrow-down" size={12} className="text-muted-foreground" />
        </SheetTrigger>

        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-0 flex flex-col bg-card/95 backdrop-blur-xl">
          <SheetHeader className="p-4 pb-2 border-b border-border/50 text-left">
            <SheetTitle className="text-base font-semibold">Switch Workspace</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Select another preparation workspace to switch context.
            </SheetDescription>
            <div className="pt-2">
              <Input
                placeholder="Search workspaces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredWorkspaces.map((ws) => {
              const isCurrent = ws.id === currentWorkspace.id
              const subtitle = [ws.targetCompany, ws.targetRole].filter(Boolean).join(" · ")
              return (
                <button
                  key={ws.id}
                  onClick={() => handleSelect(ws)}
                  disabled={isSwitching}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors min-h-[48px]",
                    isCurrent
                      ? "bg-primary/10 border border-primary/20 text-foreground"
                      : "hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <WorkspaceAvatar name={ws.name} id={ws.id} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">{ws.name}</p>
                      {subtitle && (
                        <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  {isCurrent && (
                    <AppIcon icon="check" size="md" className="text-primary shrink-0 ml-2" />
                  )}
                </button>
              )
            })}

            {filteredWorkspaces.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-8">No workspaces matched your search.</p>
            )}
          </div>

          <div className="p-3 border-t border-border/50 bg-muted/20 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-10 gap-2"
              onClick={() => {
                setOpen(false)
                setCreateDialogOpen(true)
              }}
            >
              <AppIcon icon="plus" size={14} className="text-primary" />
              Create workspace
            </Button>
            <Button
              render={<Link href="/settings/workspaces" onClick={() => setOpen(false)} />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="w-full text-xs h-10 text-muted-foreground"
            >
              Manage workspaces
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateAction={createFn}
      />
    </>
  )
}
