import { getLearningSession } from "@/features/learning/server"
import { getBehavioralSession } from "@/features/behavioral/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { ExecutionChamber } from "@/features/execution"
import { getExecutionSnapshot } from "@/features/execution/server"
export const instant=false
export default async function ExecutionPage({params}:{params:Promise<{workspaceSlug:string;sessionId:string}>}){
  await connection()
  const {workspaceSlug,sessionId}=await params
  if(!/^[0-9a-f-]{36}$/i.test(sessionId))notFound()
  const context=await resolveWorkspace(workspaceSlug)
  if(!context)notFound()
  const behavioral=await getBehavioralSession(workspaceSlug,sessionId).catch(()=>null)
  if(behavioral)redirect(`/w/${workspaceSlug}/interview/behavioral/practice/${sessionId}`)
  const learning=await getLearningSession(workspaceSlug,sessionId).catch(()=>null)
  if(learning)redirect(`/w/${workspaceSlug}/learn/activity/${sessionId}`)
  const snapshot=await getExecutionSnapshot(workspaceSlug,sessionId)
  return <ExecutionChamber snapshot={snapshot} canEdit={context.workspace.status==="active"&&context.permissions.canView}/>
}
