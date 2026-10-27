import { notFound } from "next/navigation"
import { connection } from "next/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { ExecutionLobbyPage } from "@/features/execution"
import { getExecutionLobby } from "@/features/execution/server"
export const instant=false
export default async function PracticePage({params,searchParams}:{params:Promise<{workspaceSlug:string}>;searchParams:Promise<{task?:string;focus?:string;topic?:string}>}){
  await connection()
  const {workspaceSlug}=await params,search=await searchParams,context=await resolveWorkspace(workspaceSlug)
  if(!context)notFound()
  const task=search.task&&/^[0-9a-f-]{36}$/i.test(search.task)?search.task:undefined
  return <ExecutionLobbyPage lobby={await getExecutionLobby(workspaceSlug,task)} initialTopicId={search.topic?.slice(0,120)} initialMode={search.focus==="interview"?"interview":search.focus==="timed"?"oa":"practice"}/>
}
