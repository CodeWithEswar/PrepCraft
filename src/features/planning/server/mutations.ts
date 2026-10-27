"use server"
import "server-only"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logEvent } from "@/lib/observability/logger.server"
import { resolveWorkspace } from "@/features/workspaces/server"
import type { Json } from "@/lib/supabase/types"
import { scheduledWindow, weekKeys } from "@/lib/time/workspace-calendar"
import { planningRequestSchema, dateKey } from "../schemas/planning.schema"
import { buildProposal } from "../services/plan-generation-service"
import { getPlanningSnapshot } from "./queries"
import type { PlanningResult, PlanningSnapshot } from "../types/planning.types"

export async function loadPlanningAction(slug:string,week:string):Promise<PlanningSnapshot>{
  if(!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug)||!dateKey.safeParse(week).success)throw new Error("Choose a valid workspace and week.")
  return getPlanningSnapshot(slug,week)
}
export async function mutatePlanningAction(input:unknown):Promise<PlanningResult>{
  const started=performance.now(),parsed=planningRequestSchema.safeParse(input)
  if(!parsed.success)return {success:false,error:parsed.error.issues[0]?.message||"Check the planning details."}
  const {slug,week,revision,requestId,command}=parsed.data
  try{
    const context=await resolveWorkspace(slug)
    if(!context||context.workspace.status!=="active"||!context.permissions.canEditSchedule)return {success:false,error:"This workspace is unavailable or read-only."}
    const db=await createClient(),snapshot=await getPlanningSnapshot(slug,week,context)
    const existing=await db.from("planning_activity_events").select("changes").eq("workspace_id",context.workspace.id).eq("request_id",requestId).maybeSingle()
    if(existing.error)throw new Error("Unable to confirm the last request.")
    let payload:Record<string,unknown>={...command,_client:command}
    if(existing.data){
      const saved=existing.data.changes as Record<string,unknown>
      if(JSON.stringify(saved._client)!==JSON.stringify(command))return {success:false,error:"This request identifier was already used. Refresh the page.",conflict:true}
      payload=saved
    }else{
      if(snapshot.revision!==revision)return {success:false,error:"The plan changed. Refresh and review the latest week.",conflict:true}
      if(command.kind==="apply"){
        const proposal=buildProposal(snapshot,command.proposalKind)
        if(proposal.fingerprint!==command.fingerprint)return {success:false,error:"The proposal changed. Review the new proposal before applying.",conflict:true}
        if(proposal.unplaced.length||proposal.after.some(day=>day.load>day.capacity))return {success:false,error:"Resolve the capacity conflicts before applying this proposal."}
        if(!proposal.items.length)return {success:false,error:"The proposal has no changes to apply."}
        payload={...payload,items:proposal.items,policy:proposal.policy}
      }
      if(command.kind==="add"||command.kind==="edit"){
        const day=command.kind==="add"?command.day:snapshot.days.flatMap(day=>day.tasks).find(task=>task.id===command.taskId)?.day
        if(!day)return {success:false,error:"This task is unavailable."}
        if(command.start&&command.end){const window=scheduledWindow(day,command.start,command.end,context.workspace.timezone);payload={...payload,scheduledStart:window.start,scheduledEnd:window.end}}
      }
    }
    const {error}=await db.rpc("mutate_planning",{p_slug:slug,p_week:command.kind==="carry"?weekKeys(command.day)[0]:week,p_revision:revision,p_request:requestId,p_context:snapshot.context.contextVersion,p_command:payload as Json})
    if(error){logEvent("warn","planning.mutation.rejected",{code:error.code==="40001"?"conflict":error.code==="42501"?"forbidden":"validation",durationMs:performance.now()-started});return {success:false,error:error.code==="40001"?"The schedule changed. Refresh and review the latest plan.":error.code==="22023"?error.message:error.code==="42501"?"You no longer have permission to edit this workspace.":"The change could not be saved. Check the details and try again.",conflict:error.code==="40001"}}
    revalidatePath(`/w/${slug}/plan`);revalidatePath(`/w/${slug}/today`)
    logEvent("info","planning.mutation.saved",{durationMs:performance.now()-started})
    return {success:true,snapshot:await getPlanningSnapshot(slug,week)}
  }catch(error){logEvent("error","planning.mutation.failed",{code:"unexpected",durationMs:performance.now()-started});return {success:false,error:error instanceof Error&&/daylight|local time|end time|timezone change/.test(error.message)?error.message:"Unable to confirm the latest plan. Refresh before trying again."}}
}
