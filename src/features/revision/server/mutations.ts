"use server"
import "server-only"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/types"
import { logEvent } from "@/lib/observability/logger.server"
import { queueSchema,revisionRequestSchema } from "../schemas/revision.schema"
import type { RevisionMutationResult } from "../types/revision.types"
import { getRevisionQueue,getRevisionDetail } from "./queries"
export async function loadRevisionQueue(input:unknown){const parsed=queueSchema.safeParse(input);if(!parsed.success)return {success:false as const,error:"Check the revision filters."};try{return {success:true as const,snapshot:await getRevisionQueue(parsed.data.slug,parsed.data.filters,parsed.data.cursor)}}catch{return {success:false as const,error:"The revision queue could not be loaded. Try again."}}}
export async function loadRevisionDetail(slug:string,id:string,before?:{at:string;id:string}){try{return {success:true as const,detail:await getRevisionDetail(slug,id,before)}}catch{return {success:false as const,error:"The review history could not be loaded. Your queue remains available."}}}
export async function reconcileRevisionAction(slug:string){if(!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug))return {success:false as const};try{const db=await createClient(),{data,error}=await db.rpc("reconcile_revision",{p_slug:slug});if(error){logEvent("warn","revision.reconcile.failed",{code:error.code});return {success:false as const}}revalidatePath(`/w/${slug}/revision`);return {success:true as const,count:data}}catch{logEvent("warn","revision.reconcile.failed",{code:"network"});return {success:false as const}}}
export async function mutateRevisionAction(input:unknown):Promise<RevisionMutationResult>{
 const parsed=revisionRequestSchema.safeParse(input);if(!parsed.success)return {success:false,error:parsed.error.issues[0]?.message||"Check the revision details."}
 try{const {slug,itemId,version,requestId,command}=parsed.data,db=await createClient(),{data,error}=await db.rpc("mutate_revision",{p_slug:slug,p_item:itemId,p_version:version,p_request:requestId,p_command:command as unknown as Json})
 if(error){logEvent("warn","revision.mutation.rejected",{code:error.code});return {success:false,error:error.code==="40001"?"This revision changed. Refresh and review the latest schedule.":error.code==="22023"?error.message:error.code==="42501"?"This workspace is unavailable or read-only.":"The revision change could not be confirmed.",conflict:error.code==="40001"}}
 for(const path of ["revision","today","plan"])revalidatePath(`/w/${slug}/${path}`)
 logEvent("info",`revision.${command.kind}.saved`,{code:"committed"})
 return {success:true,payload:data as unknown as Extract<RevisionMutationResult,{success:true}>["payload"]}
 }catch{return {success:false,error:"The server could not confirm this change. Refresh before retrying."}}
}
