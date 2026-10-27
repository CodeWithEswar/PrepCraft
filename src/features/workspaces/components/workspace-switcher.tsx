"use client"
import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { resolveWorkspaceSwitchDestination, workspaceQueryKeys } from "../services/workspace-switch"
import type { WorkspaceListItem, MutationResult } from "../types/workspace.types"
import { CreateWorkspaceDialog } from "./create-workspace-dialog"
import { WorkspacePicker } from "./workspace-picker"
import type { CreateWorkspaceValues } from "../schemas/workspace.schema"
import { switchWorkspaceAction, createWorkspaceAction } from "../server/mutations"

interface WorkspaceSwitcherProps {
  currentWorkspace: { id:string; name:string; slug:string; targetRole?:string|null; targetCompany?:string|null }
  workspaces: WorkspaceListItem[]
  onSwitchAction?: (workspaceId:string)=>Promise<MutationResult>
  onCreateAction?: (values:CreateWorkspaceValues)=>Promise<MutationResult<{workspaceId:string;slug:string}>>
}

export function WorkspaceSwitcher({currentWorkspace,workspaces,onSwitchAction,onCreateAction}:WorkspaceSwitcherProps) {
  const router=useRouter()
  const pathname=usePathname()
  const queryClient=useQueryClient()
  const [open,setOpen]=React.useState(false)
  const [createDialogOpen,setCreateDialogOpen]=React.useState(false)
  const [error,setError]=React.useState<string|null>(null)
  const [isSwitching,startTransition]=React.useTransition()
  const switchFn=onSwitchAction||switchWorkspaceAction

  const handleSelectWorkspace=(workspace:WorkspaceListItem)=>{
    if(workspace.id===currentWorkspace.id){setOpen(false);return}
    setError(null)
    startTransition(async()=>{
      try {
        await queryClient.cancelQueries({queryKey:workspaceQueryKeys.workspace(currentWorkspace.id)})
        const result=await switchFn(workspace.id)
        if(!result.success){setError(result.error||"Could not switch workspaces. Please try again.");return}
        queryClient.removeQueries({queryKey:workspaceQueryKeys.workspace(currentWorkspace.id)})
        setOpen(false)
        router.push(resolveWorkspaceSwitchDestination(pathname,workspace.slug))
      } catch {setError("Could not switch workspaces. Please try again.")}
    })
  }

  return <>
    <WorkspacePicker currentWorkspace={currentWorkspace} workspaces={workspaces} open={open} onOpenChange={value=>{setOpen(value);if(value)setError(null)}} onSelectWorkspace={handleSelectWorkspace} switching={isSwitching} error={error} onCreateWorkspace={()=>{setOpen(false);setCreateDialogOpen(true)}}/>
    <CreateWorkspaceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onCreateAction={onCreateAction||createWorkspaceAction}/>
  </>
}
