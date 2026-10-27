import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { TaskType } from "@/types/preparation"
/** Infrastructure projection shared by Today and Planning; no feature-level dependency cycle. */
export async function readWorkspaceExecutionFocus(workspaceId:string,from:string,to:string){
  const db=await createClient(),{data,error}=await db.rpc("execution_focus",{p_workspace:workspaceId,p_from:from,p_to:to})
  if(error)throw new Error("Execution time is unavailable")
  return data.map(row=>({workspaceId:row.workspace_id,start:row.started_at,end:row.ended_at,type:row.task_type as TaskType}))
}
export async function readWorkspaceExecutionTaskLinks(workspaceId:string,taskIds:string[]){
  if(!taskIds.length)return []
  const db=await createClient(),{data,error}=await db.rpc("execution_task_links",{p_workspace:workspaceId,p_tasks:taskIds.slice(0,200)})
  if(error)throw new Error("Execution links are unavailable")
  return data
}
