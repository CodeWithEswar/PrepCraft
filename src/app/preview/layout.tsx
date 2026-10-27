import type { Metadata } from "next"
import { WorkspacePreviewShell } from "@/features/workspace-preview"
import "@/components/shell/shell.css"
import "@/features/today/dashboard.css"
import "@/features/today/today.css"
import "@/features/today/today-reference.css"
import "@/features/planning/planning.css"
import "@/features/execution/execution.css"
import "@/features/revision/revision.css"
import "@/features/mastery/mastery.css"
import "@/features/workspace-preview/preview.css"

export const metadata:Metadata={title:"Workspace preview",robots:{index:false,follow:false}}
export default function WorkspacePreviewLayout({children}:{children:React.ReactNode}) {
  return <WorkspacePreviewShell>{children}</WorkspacePreviewShell>
}
