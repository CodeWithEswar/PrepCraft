"use server"
import "server-only"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logEvent } from "@/lib/observability/logger.server"
import type { Json } from "@/lib/supabase/types"
import { launchSchema,executionRequestSchema } from "../schemas/execution.schema"
import { getExecutionSnapshot } from "./queries"
import { mapExecution } from "./map-execution"
import { mutateTodayAction } from "@/features/today/server"
import { dayKeyAt } from "@/lib/time/workspace-calendar"
import type { ExecutionActionResult,ExecutionSnapshot } from "../types/execution.types"
type Envelope={ok:boolean;code?:string;data:Json}
export async function loadExecutionAction(slug:string,sessionId:string):Promise<{success:true;snapshot:ExecutionSnapshot}|{success:false;error:string;denied:boolean}>{
  if(!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug)||!/^[0-9a-f-]{36}$/i.test(sessionId))return {success:false,error:"Session unavailable",denied:true}
  try{return {success:true,snapshot:await getExecutionSnapshot(slug,sessionId)}}catch(error){const denied=error instanceof Error&&error.message==="Session access unavailable";return {success:false,error:denied?"You no longer have access to this session.":"The session could not be synchronized. Your saved work is preserved.",denied}}
}
export async function createExecutionAction(input:unknown):Promise<ExecutionActionResult>{
  const parsed=launchSchema.safeParse(input);if(!parsed.success)return {success:false,error:parsed.error.issues[0]?.message||"Check the session setup."}
  try{const {slug,requestId,...payload}=parsed.data,db=await createClient(),{data,error}=await db.rpc("create_execution",{p_slug:slug,p_request:requestId,p_payload:payload as unknown as Json})
    if(error){logEvent("warn","execution.launch.rejected",{code:error.code});return {success:false,error:error.code==="22023"?error.message:error.code==="42501"?"This workspace is unavailable or read-only.":"The session could not be started. Please try again."}}
    const response=data as unknown as Envelope,snapshot=mapExecution(response.data)
    if(!response.ok)return {success:false,error:"You already have an active session. Continue or end it before starting another.",snapshot}
    revalidatePath(`/w/${slug}/today`)
    return {success:true,snapshot}
  }catch{logEvent("error","execution.launch.failed",{code:"unexpected"});return {success:false,error:"Unable to confirm session creation. Refresh Practice before retrying."}}
}
export async function mutateExecutionAction(input:unknown):Promise<ExecutionActionResult>{
  const parsed=executionRequestSchema.safeParse(input);if(!parsed.success)return {success:false,error:parsed.error.issues[0]?.message||"Check the execution details."}
  const {slug,sessionId,version,requestId,command}=parsed.data
  try{const db=await createClient(),{data,error}=await db.rpc("mutate_execution",{p_slug:slug,p_session:sessionId,p_version:version,p_request:requestId,p_command:command as unknown as Json})
    if(error){logEvent("warn","execution.mutation.rejected",{code:error.code});return {success:false,error:error.code==="40001"?"This session changed in another tab. Review the latest state before saving.":error.code==="22023"?error.message:error.code==="42501"?"You no longer have access to this session.":"The change could not be confirmed. Your draft has been kept.",conflict:error.code==="40001"}}
    const response=data as unknown as Envelope,snapshot=mapExecution(response.data)
    if(!response.ok)return {success:false,error:"Time has expired. Working changes are locked; your previously saved work is preserved.",snapshot}
    if(command.kind==="debrief"&&command.completeLinkedTask&&snapshot.session.taskId&&snapshot.attempts.every(attempt=>attempt.reflectionStatus==="completed")){
      // The attempt is already committed. A separate Today failure must never roll it back.
      try{
        const row=await db.from("daily_tasks").select("id,status,version,daily_plan_id").eq("workspace_id",snapshot.workspace.id).eq("id",snapshot.session.taskId).maybeSingle()
        const plan=row.data?await db.from("daily_plans").select("plan_date").eq("workspace_id",snapshot.workspace.id).eq("id",row.data.daily_plan_id).maybeSingle():null
        const today=dayKeyAt(new Date(),snapshot.workspace.timezone)
        if(row.data?.status==="completed")snapshot.notice="The linked Today task is complete."
        else if(row.data&&plan?.data?.plan_date===today){const completion=await mutateTodayAction({kind:"complete",slug,dayKey:today,taskId:row.data.id,version:row.data.version});snapshot.notice=completion.success?"The linked Today task is complete.":"Attempt saved. Review the linked task in Today before marking it complete."}
        else snapshot.notice="Attempt saved. The linked task belongs to an earlier day; review its schedule in Planning."
      }catch{snapshot.notice="Attempt saved. The linked task still needs review in Today."}
    }
    if(["pause","resume","finish","abandon","debrief"].includes(command.kind)){revalidatePath(`/w/${slug}/today`);revalidatePath(`/w/${slug}/plan`);if(command.kind==="debrief")revalidatePath(`/w/${slug}/revision`)}
    return {success:true,snapshot}
  }catch{logEvent("error","execution.mutation.failed",{code:"unexpected"});return {success:false,error:"The server could not confirm this change. Your draft has been kept."}}
}
