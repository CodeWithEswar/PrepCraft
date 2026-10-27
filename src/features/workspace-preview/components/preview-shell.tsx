"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { NotificationBell } from "@/features/notifications"
import { AppShell, preparationNavigation } from "@/components/shell"
import { WorkspacePicker, type WorkspaceListItem } from "@/features/workspaces"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const generalWorkspace:WorkspaceListItem={id:"preview-general",name:"General SDE Preparation",slug:"general-sde",status:"active",targetCompany:null,targetRole:"Software engineer",targetDate:null,weeklyMinutes:600,preparationLevel:"developing",interviewLanguage:"java",role:"owner",updatedAt:"2026-10-24T00:00:00Z"}
const sampleWorkspaces:WorkspaceListItem[]=[generalWorkspace,{...generalWorkspace,id:"preview-amazon",slug:"amazon-sde",name:"Amazon interview prep",targetCompany:"Amazon",targetRole:"SDE II"},{...generalWorkspace,id:"preview-archive",slug:"foundations",name:"CS foundations",targetRole:"Core fundamentals",status:"archived"}]

function PreviewWorkspaceControl({current,onSelect,onCreate}:{current:WorkspaceListItem;onSelect:(workspace:WorkspaceListItem)=>void;onCreate:()=>void}) {
  const [open,setOpen]=useState(false)
  return <WorkspacePicker currentWorkspace={current} workspaces={sampleWorkspaces} open={open} onOpenChange={setOpen} onSelectWorkspace={workspace=>{onSelect(workspace);setOpen(false)}} onCreateWorkspace={()=>{setOpen(false);onCreate()}} manageHref="/preview/settings"/>
}

export function WorkspacePreviewShell({children}:{children:React.ReactNode}) {
  const pathname=usePathname()
  const [current,setCurrent]=useState(generalWorkspace)
  const [createOpen,setCreateOpen]=useState(false)
  if(pathname==="/preview/practice"||pathname==="/preview/execution"||pathname==="/preview/timed-practice"||pathname==="/preview/behavioral/practice")return <>{children}</>
  return <>
    <AppShell preview notificationControl={<NotificationBell slug="general-sde" userId="10000000-0000-4000-8000-000000000002" workspaceId="10000000-0000-4000-8000-000000000001" preview/>} dashboardHref="/preview" settingsHref="/preview/settings" workspaceName={current.name} userName="Alex" navigation={preparationNavigation(section=>`/preview/${section}`)} workspaceControl={<PreviewWorkspaceControl current={current} onSelect={setCurrent} onCreate={()=>setCreateOpen(true)}/>}>{children}</AppShell>
    <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>A workspace for your next goal.</DialogTitle><DialogDescription>This selector uses sample workspaces. Sign in to create and manage your own preparation spaces.</DialogDescription></DialogHeader><Button render={<Link href="/login"/>}>Continue to sign in</Button></DialogContent></Dialog>
  </>
}
