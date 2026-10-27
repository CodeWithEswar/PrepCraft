import { getMasterySnapshot } from "@/features/mastery/server"
import "server-only"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { logEvent } from "@/lib/observability/logger.server"
import { catalogSchema } from "../schemas/learning.schema"
import { mapExecution } from "@/features/execution/server"
import type { LearningCatalog,ConceptDetail,LearningOverview,LearningSession } from "../types/learning.types"
import type { Json } from "@/lib/supabase/types"
export async function getLearningCatalog(input:unknown):Promise<LearningCatalog>{
 const p=catalogSchema.parse(input),start=performance.now(),db=await createClient(),{data,error}=await db.rpc("learning_catalog",{p_slug:p.slug,p_subject:p.subject,p_topic:p.topic??undefined,p_search:p.search,p_after:p.after??undefined,p_bookmarked:p.bookmarked})
 if(error||!data){logEvent("error","learning.catalog.failed",{code:error?.code||"empty"});throw new Error("Learning content could not be loaded.")}
 logEvent("info","learning.catalog.loaded",{durationMs:performance.now()-start});return data as unknown as LearningCatalog
}
export async function getLearningConcept(slug:string,id:string):Promise<ConceptDetail>{const db=await createClient(),start=performance.now(),{data,error}=await db.rpc("learning_concept",{p_slug:slug,p_id:id});if(error||!data)throw new Error("This published lesson is unavailable.");logEvent("info","learning.concept.loaded",{durationMs:performance.now()-start});const detail=data as unknown as ConceptDetail;try{const mastery=await getMasterySnapshot(slug,90,false),result=mastery.results.find(r=>r.area.kind==="topic"&&r.area.id===detail.concept.topic_id);detail.evidence={state:"ready",level:result?.level||"unassessed",confidence:result?.evidenceConfidence||"insufficient",attempts:result?.aggregate?.attempts||0,scope:"topic"}}catch{detail.evidence={state:"unavailable",level:"unassessed",confidence:"insufficient",attempts:0,scope:"topic"};logEvent("warn","learning.mastery.unavailable",{code:"unavailable"})}return detail}
export async function getLearningOverview(slug:string):Promise<LearningOverview>{const db=await createClient(),{data,error}=await db.rpc("learning_overview",{p_slug:slug});if(error||!data)throw new Error("Learning evidence could not be loaded.");return data as unknown as LearningOverview}
export function mapLearningSession(raw:Json):LearningSession{const value=raw as unknown as LearningSession;return {...value,execution:mapExecution(value.execution as unknown as Json)}}
export async function getLearningSession(slug:string,id:string):Promise<LearningSession>{const db=await createClient(),{data,error}=await db.rpc("learning_session",{p_slug:slug,p_session:id});if(error||!data)throw new Error("Learning session unavailable.");return mapLearningSession(data)}
export async function getLearningContext(slug:string){const context=await resolveWorkspace(slug);if(!context?.permissions.canView)throw new Error("Learning workspace unavailable.");return context}
/** Read-only recommendation adapter. Today retains ordering; Planning retains task creation. */
export async function getLearningCandidates(slug:string){const context=await getLearningContext(slug),overview=await getLearningOverview(slug);return {workspaceId:context.workspace.id,actions:overview.continue.slice(0,2).map(c=>({id:c.concept_id,title:`Continue ${c.name}`,detail:"Recently opened learning concept",href:`/w/${slug}/learn/concept/${c.concept_id}`}))}}
