"use server"
import "server-only"
import { learningPreview,previewConcept } from "./preview"
import { catalogSchema,identitySchema } from "../schemas/learning.schema"
import type { ActionResult,LearningCatalog,ConceptDetail } from "../types/learning.types"
export async function previewCatalogAction(input:unknown):Promise<ActionResult<LearningCatalog>>{const p=catalogSchema.safeParse(input);if(!p.success)return {ok:false,error:"Invalid search."};const data=learningPreview(p.data.subject,p.data.topic,p.data.search,p.data.after);if(p.data.bookmarked)data.concepts=[];return {ok:true,data}}
export async function previewConceptAction(id:string):Promise<ActionResult<ConceptDetail>>{if(!identitySchema.safeParse(id).success)return {ok:false,error:"Invalid concept."};const data=previewConcept(id);return data?{ok:true,data}:{ok:false,error:"This lesson is still in preparation."}}
