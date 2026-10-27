"use server"
import "server-only"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { getWorkspaceCurriculum } from "@/features/templates/server"
import { logEvent } from "@/lib/observability/logger.server"
import { getMasterySnapshot,getMasterySpine } from "./queries"
const slugSchema=z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/),idSchema=z.string().min(1).max(120)
const requestSchema=z.object({slug:slugSchema,days:z.union([z.literal(7),z.literal(30),z.literal(90),z.literal(365)])})
export async function loadMasteryAction(input:unknown){const parsed=requestSchema.safeParse(input);if(!parsed.success)return {success:false as const,error:"Choose a supported evidence window."};try{return {success:true as const,snapshot:await getMasterySnapshot(parsed.data.slug,parsed.data.days)}}catch{return {success:false as const,error:"Mastery could not be refreshed. Previously recorded evidence is preserved."}}}
export async function loadMasterySpineAction(input:unknown){const parsed=z.object({slug:slugSchema,kind:z.enum(["topic","pattern"]),id:idSchema,cursor:z.object({at:z.iso.datetime({offset:true}),id:z.uuid()}).nullable()}).safeParse(input);if(!parsed.success)return {success:false as const,error:"Check the evidence selection."};try{const p=parsed.data;return {success:true as const,...await getMasterySpine(p.slug,p.kind,p.id,p.cursor)}}catch{return {success:false as const,error:"History unavailable. The current interpretation is still available."}}}
export async function assignEvidenceTopicAction(input:unknown){
 const parsed=z.object({slug:slugSchema,itemId:z.uuid(),topicId:idSchema}).safeParse(input);if(!parsed.success)return {success:false as const,error:"Choose an owned item and curriculum topic."}
 try{const {slug,itemId,topicId}=parsed.data,context=await resolveWorkspace(slug);if(!context||context.workspace.status!=="active")return {success:false as const,error:"Workspace is unavailable or read-only."}
 const curriculum=await getWorkspaceCurriculum(context.workspace.id);if(!curriculum?.tracks.some(track=>track.topics.some(topic=>topic.topicId===topicId)))return {success:false as const,error:"Choose a topic from this workspace's pinned curriculum."}
 const db=await createClient(),{error}=await db.rpc("assign_execution_topic",{p_slug:slug,p_item:itemId,p_topic:topicId});if(error){logEvent("warn","mastery.attribution.rejected",{code:error.code});return {success:false as const,error:error.code==="40001"?"This evidence was already assigned. Refresh the page.":"Topic attribution could not be saved."}}
 revalidatePath(`/w/${slug}/progress`);revalidatePath(`/w/${slug}/progress/mastery`);return {success:true as const}
 }catch{return {success:false as const,error:"The topic could not be confirmed. Your evidence is unchanged."}}
}
