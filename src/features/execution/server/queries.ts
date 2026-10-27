import "server-only"
import { getWorkspaceCurriculum } from "@/features/templates/server"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { dayKeyAt } from "@/lib/time/workspace-calendar"
import { logEvent } from "@/lib/observability/logger.server"
import { mapExecution } from "./map-execution"
import type { ExecutionLobby,ExecutionSnapshot } from "../types/execution.types"
export async function getExecutionSnapshot(slug:string,id:string):Promise<ExecutionSnapshot>{
  const context=await resolveWorkspace(slug)
  if(!context||!context.permissions.canView)throw new Error("Session access unavailable")
  const db=await createClient(),{data,error}=await db.rpc("resolve_execution",{p_slug:slug,p_session:id})
  if(error?.code==="42501")throw new Error("Session access unavailable")
  if(error||!data)throw new Error("The session could not be restored. Refresh before changing it.")
  const snapshot=mapExecution(data)
  if(snapshot.workspace.id!==context.workspace.id||snapshot.session.userId!==context.membership.userId)throw new Error("Session access unavailable")
  return snapshot
}
export async function getExecutionLobby(slug:string,taskId?:string):Promise<ExecutionLobby>{
  const context=await resolveWorkspace(slug)
  if(!context||!context.permissions.canView)throw new Error("Workspace unavailable")
  const db=await createClient(),workspaceId=context.workspace.id,userId=context.membership.userId
  const recent=await db.from("execution_sessions").select("*").eq("workspace_id",workspaceId).eq("user_id",userId).order("started_at",{ascending:false}).limit(12)
  if(recent.error){
    logEvent("error","execution.history.failed",{code:recent.error.code,error:recent.error.message})
    throw new Error("Execution history could not be loaded.")
  }
  const activeRow=recent.data.find(session=>["active","paused"].includes(session.status)),active=activeRow?await getExecutionSnapshot(slug,activeRow.id):null
  const ids=recent.data.map(row=>row.id)
  const [itemRows,attemptRows]=await Promise.all([
    ids.length?db.from("execution_session_items").select("session_id,title").eq("workspace_id",workspaceId).eq("user_id",userId).in("session_id",ids).eq("position",0):Promise.resolve({data:[],error:null}),
    ids.length?db.from("question_attempts").select("session_id").eq("workspace_id",workspaceId).eq("user_id",userId).in("session_id",ids).eq("reflection_status","pending"):Promise.resolve({data:[],error:null}),
  ])
  if(itemRows.error||attemptRows.error){
    const failingError = itemRows.error || attemptRows.error
    logEvent("error","execution.history.items_failed",{code:failingError?.code,error:failingError?.message})
    throw new Error("Execution history could not be loaded.")
  }
  let task:ExecutionLobby["task"]=null
  if(taskId){
    const row=await db.from("daily_tasks").select("*").eq("workspace_id",workspaceId).eq("id",taskId).maybeSingle()
    if(row.error||!row.data||row.data.source_type!=="custom"||!["planned","in_progress"].includes(row.data.status))throw new Error("Choose an available custom task from Today.")
    const plan=await db.from("daily_plans").select("plan_date,status,lifecycle").eq("workspace_id",workspaceId).eq("id",row.data.daily_plan_id).maybeSingle()
    if(!plan.data||plan.data.plan_date!==dayKeyAt(new Date(),context.workspace.timezone)||plan.data.status!=="active"||plan.data.lifecycle!=="active")throw new Error("Move this task to an active Today plan before starting a session.")
    task={id:row.data.id,title:row.data.title,notes:row.data.notes,minutes:row.data.estimated_minutes,type:row.data.task_type as NonNullable<ExecutionLobby["task"]>["type"]}
  }
  const curriculum=await getWorkspaceCurriculum(workspaceId)
  return {topics:curriculum?.tracks.flatMap(track=>track.topics.map(topic=>({id:topic.topicId,name:topic.name})))||[],workspace:{id:workspaceId,slug,name:context.workspace.name,timezone:context.workspace.timezone,userId},active:active&&["active","paused"].includes(active.session.status)?active:null,recent:recent.data.map(row=>({id:row.id,mode:row.mode as ExecutionLobby["recent"][number]["mode"],title:itemRows.data?.find(item=>item.session_id===row.id)?.title||"Preparation session",status:(active?.session.id===row.id?active.session.status:row.status) as ExecutionLobby["recent"][number]["status"],startedAt:row.started_at,reflectionPending:attemptRows.data?.some(attempt=>attempt.session_id===row.id)||false})),task,canEdit:context.workspace.status==="active"&&context.permissions.canView}
}
export async function getAttemptFollowup(slug:string,attemptId:string):Promise<string|null>{
  const context=await resolveWorkspace(slug);if(!context)return null
  const db=await createClient(),attempt=await db.from("question_attempts").select("item_id").eq("workspace_id",context.workspace.id).eq("user_id",context.membership.userId).eq("id",attemptId).eq("reflection_status","completed").maybeSingle()
  if(!attempt.data)return null
  const item=await db.from("execution_session_items").select("title").eq("workspace_id",context.workspace.id).eq("user_id",context.membership.userId).eq("id",attempt.data.item_id).maybeSingle()
  return item.data?`Retry ${item.data.title}`.slice(0,160):null
}
