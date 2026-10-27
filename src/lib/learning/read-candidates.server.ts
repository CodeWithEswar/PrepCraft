import "server-only"
import { createClient } from "@/lib/supabase/server"
/** Read-only integration DTO. Learning owns state; consumers choose their own ordering. */
export async function getLearningCandidates(slug:string){const db=await createClient(),{data,error}=await db.rpc("learning_overview",{p_slug:slug});if(error||!data)throw new Error("Learning contribution unavailable");const rows=(data as {continue?:{concept_id:string;name:string}[]}).continue||[];return {workspaceId:(data as {workspaceId?:string}).workspaceId,actions:rows.slice(0,2).map(c=>({id:c.concept_id,title:`Continue ${c.name}`,detail:"Recently opened learning concept",href:`/w/${slug}/learn/concept/${c.concept_id}`}))}}
