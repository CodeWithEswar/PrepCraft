"use server"
import "server-only"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logEvent } from "@/lib/observability/logger.server"
import { resolveWorkspace } from "@/features/workspaces/server"
import type { Json } from "@/lib/supabase/types"
import { todayCommandSchema } from "../schemas/today.schema"
import { getTodaySnapshot } from "./queries"
import type { TodayMutationResult, TodaySnapshot } from "../types/today.types"

export async function loadTodayAction(slug:string):Promise<TodaySnapshot> {
  if(!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug))throw new Error("Workspace unavailable")
  return getTodaySnapshot(slug)
}
export async function mutateTodayAction(input:unknown):Promise<TodayMutationResult> {
  const started=performance.now()
  const parsed=todayCommandSchema.safeParse(input)
  if(!parsed.success)return {success:false,error:parsed.error.issues[0]?.message||"Check this task and try again."}
  const command=parsed.data
  try {
    const context=await resolveWorkspace(command.slug)
    if(!context||context.workspace.status!=="active")return {success:false,error:"This workspace is unavailable or read-only."}
    const db=await createClient()
    const {error}=await db.rpc("mutate_today",{p_slug:command.slug,p_day:command.dayKey,p_command:command as unknown as Json})
    if(error){logEvent("warn","today.task.mutation_rejected",{code:error.code==="42501"?"forbidden":error.code==="40001"?"conflict":"validation",durationMs:performance.now()-started});return {success:false,error:error.code==="40001"?"The day, plan or task changed. Refresh Today and try again.":error.code==="42501"?"You no longer have permission to change this task.":error.code==="22023"?error.message:"The task could not be saved. Please try again."}}
    revalidatePath(`/w/${context.workspace.slug}/today`)
    // Re-resolve: preferences/target/membership may have changed during the transaction.
    const snapshot=await getTodaySnapshot(command.slug)
    logEvent("info","today.task.mutation_succeeded",{durationMs:performance.now()-started})
    return {success:true,snapshot}
  }catch{logEvent("error","today.task.mutation_failed",{code:"unexpected",durationMs:performance.now()-started});return {success:false,error:"Unable to confirm the latest plan. Refresh before trying again."}}
}
