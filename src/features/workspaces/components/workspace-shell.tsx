"use client"

import { NotificationBell } from "@/features/notifications"
import { AppShell, preparationNavigation } from "@/components/shell"
import { usePathname } from "next/navigation"
import { WorkspaceSwitcher } from "./workspace-switcher"
import type { WorkspaceListItem } from "../types/workspace.types"

interface WorkspaceShellProps {
  children:React.ReactNode
  currentWorkspace:{userId?:string;id:string;name:string;slug:string;targetRole?:string|null;targetCompany?:string|null}
  workspaces:WorkspaceListItem[]
  userName?:string
  profileAction?:React.ReactNode
  archived?:boolean
}

export function WorkspaceShell({children,currentWorkspace,workspaces,userName,profileAction,archived}:WorkspaceShellProps) {
  const pathname=usePathname()
  if(/^\/w\/[^/]+\/(?:session\/[^/]+|interview\/behavioral\/practice\/[^/]+)\/?$/.test(pathname))return <>{children}</>
  const base=`/w/${currentWorkspace.slug}`
  const destinations:Record<string,string>={practice:"practice",learn:"learn",fundamentals:"learn/java",aptitude:"learn/aptitude","timed-practice":"practice?focus=timed","questions":"practice?focus=questions",behavioral:"interview/behavioral",interview:"interview",projects:"interview?focus=projects","interview-tracker":"interview?focus=tracker",plan:"plan",progress:"progress",mistakes:"progress?focus=mistakes",revision:"revision",patterns:"progress?focus=patterns",applications:"applications",resources:"templates"}
  return <AppShell notificationControl={currentWorkspace.userId?<NotificationBell slug={currentWorkspace.slug} userId={currentWorkspace.userId} workspaceId={currentWorkspace.id}/>:undefined} dashboardHref={`${base}/today`} settingsHref={`${base}/settings`} workspaceName={currentWorkspace.name} userName={userName} profileAction={profileAction} archived={archived} workspaceControl={<WorkspaceSwitcher currentWorkspace={currentWorkspace} workspaces={workspaces}/>} navigation={preparationNavigation(section=>`${base}/${destinations[section]??section}`)}>{children}</AppShell>
}
