"use client"

import { useId } from "react"
import Link from "next/link"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import type { WorkspaceListItem } from "../types/workspace.types"
import "./workspace-picker.css"

export interface WorkspacePickerProps {
  currentWorkspace: {id:string;name:string;slug:string;targetRole?:string|null;targetCompany?:string|null}
  workspaces:WorkspaceListItem[]
  open:boolean
  onOpenChange:(open:boolean)=>void
  onSelectWorkspace:(workspace:WorkspaceListItem)=>void
  onCreateWorkspace:()=>void
  switching?:boolean
  error?:string|null
  manageHref?:string
}

export function WorkspacePicker({currentWorkspace,workspaces,open,onOpenChange,onSelectWorkspace,onCreateWorkspace,switching=false,error,manageHref="/settings/workspaces"}:WorkspacePickerProps) {
  const popupId=useId()
  const active=workspaces.filter(workspace=>workspace.status==="active")
  const archived=workspaces.filter(workspace=>workspace.status==="archived")
  const subtitle=currentWorkspace.targetRole||currentWorkspace.targetCompany||"Preparation workspace"

  const options=(items:WorkspaceListItem[],isArchived=false)=>items.map(workspace=>{
    const current=workspace.id===currentWorkspace.id
    const detail=[workspace.targetCompany,workspace.targetRole].filter(Boolean).join(" · ")||"Preparation workspace"
    return <CommandItem
      key={workspace.id}
      value={`${workspace.id} ${workspace.name} ${workspace.targetCompany||""} ${workspace.targetRole||""}`}
      keywords={[workspace.name,workspace.targetCompany||"",workspace.targetRole||""]}
      disabled={switching}
      showIndicator={false}
      data-current={current}
      className="pc-workspace-picker-option"
      onSelect={()=>onSelectWorkspace(workspace)}
    >
      <span className="pc-workspace-picker-mark"><AppIcon icon={isArchived?"folder":workspace.targetCompany?"building":"dashboard"} size={18}/></span>
      <span className="pc-workspace-picker-option-copy"><strong>{workspace.name}</strong><small>{detail}</small></span>
      {current?<span className="pc-workspace-picker-check"><AppIcon icon="check" size={17}/><span className="sr-only">Current workspace</span></span>:isArchived?<span className="pc-workspace-picker-archived">Archived</span>:null}
    </CommandItem>
  })

  return <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger render={<Button variant="ghost" className="pc-workspace-picker-trigger" aria-haspopup="dialog" aria-expanded={open} aria-controls={open?popupId:undefined} disabled={switching} title={currentWorkspace.name}/>}>
      <span className="pc-workspace-picker-mark"><AppIcon icon="dashboard" size={21}/></span>
      <span className="pc-workspace-picker-trigger-copy"><strong>{currentWorkspace.name}</strong><small>{subtitle}</small></span>
      <span className="pc-workspace-picker-toggle"><AppIcon icon={switching?"spinner":"sort"} size={17} className={switching?"animate-spin":undefined}/></span>
      <span className="sr-only">Switch workspace</span>
    </PopoverTrigger>
    <PopoverContent id={popupId} aria-label="Choose a preparation workspace" align="start" sideOffset={8} className="pc-workspace-picker">
      <div className="pc-workspace-picker-heading"><span>Your workspaces</span><small>{active.length} active</small></div>
      <Command label="Search workspaces" className="pc-workspace-picker-command">
        <div className="pc-workspace-picker-search"><CommandInput aria-label="Search workspaces" placeholder="Search workspaces…"/></div>
        <CommandList className="pc-workspace-picker-list">
          <CommandEmpty className="pc-workspace-picker-empty"><AppIcon icon="search" size={22}/><strong>No workspace found</strong><span>Try a name, company, or role.</span></CommandEmpty>
          <CommandGroup heading="Active workspaces">{options(active)}</CommandGroup>
          {archived.length>0&&<CommandGroup heading="Archived workspaces">{options(archived,true)}</CommandGroup>}
        </CommandList>
      </Command>
      {error&&<p className="pc-workspace-picker-error" role="alert"><AppIcon icon="alert-circle" size={16}/>{error}</p>}
      <div className="pc-workspace-picker-actions">
        <Button variant="ghost" disabled={switching} onClick={onCreateWorkspace}><span className="pc-workspace-picker-action-icon"><AppIcon icon="plus" size={18}/></span><span>Create workspace</span><AppIcon icon="arrow-right" size={14}/></Button>
        <Button variant="ghost" nativeButton={false} render={<Link href={manageHref} onClick={()=>onOpenChange(false)}/>}><span className="pc-workspace-picker-action-icon"><AppIcon icon="settings" size={18}/></span><span>Manage workspaces</span><AppIcon icon="chevron-right" size={14}/></Button>
      </div>
    </PopoverContent>
  </Popover>
}
