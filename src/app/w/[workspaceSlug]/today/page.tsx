import { notFound } from "next/navigation"
import { connection } from "next/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { TodayDashboard } from "@/features/today"
import { getTodaySnapshot } from "@/features/today/server"

export const instant = false

export default async function TodayPage({params}:{params:Promise<{workspaceSlug:string}>}) {
  await connection()
  const {workspaceSlug}=await params
  const context=await resolveWorkspace(workspaceSlug)
  if(!context) notFound()
  const snapshot=await getTodaySnapshot(workspaceSlug,context)
  return <TodayDashboard key={`${snapshot.context.workspaceId}:${snapshot.dayKey}`} snapshot={snapshot}/>
}
