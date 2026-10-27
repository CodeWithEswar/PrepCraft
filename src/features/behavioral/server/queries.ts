import "server-only"
import { createClient } from "@/lib/supabase/server"
import { mapExecution } from "@/features/execution/server"
import { logEvent } from "@/lib/observability/logger.server"
import type { Json } from "@/lib/supabase/types"
import type { BehavioralHome,StoryDetail,BehavioralSession,StoryFilters,StoryMapping } from "../types/behavioral.types"
export async function getBehavioralHome(slug:string,filters:Partial<StoryFilters>={}):Promise<BehavioralHome>{const start=performance.now(),db=await createClient(),{data,error}=await db.rpc("behavioral_home",{p_slug:slug,p_filters:filters as Json});if(error||!data){logEvent("error","behavioral.home.failed",{code:error?.code||"empty"});throw new Error("Behavioral workspace unavailable.")}logEvent("info","behavioral.home.loaded",{durationMs:performance.now()-start});return data as unknown as BehavioralHome}
export async function getStoryDetail(slug:string,id:string):Promise<StoryDetail>{const db=await createClient(),{data,error}=await db.rpc("behavioral_detail",{p_slug:slug,p_story:id});if(error||!data)throw new Error("Story unavailable.");const d=data as unknown as Omit<StoryDetail,"mappings">&{mappings:(StoryMapping&{principle_id:string})[]};return {...d,mappings:d.mappings.map(m=>({...m,id:m.principle_id}))}}
export function mapBehavioralSession(data:Json):BehavioralSession{const v=data as unknown as BehavioralSession;return {...v,execution:mapExecution(v.execution as unknown as Json)}}
export async function getBehavioralSession(slug:string,id:string):Promise<BehavioralSession>{const db=await createClient(),{data,error}=await db.rpc("behavioral_session",{p_slug:slug,p_session:id});if(error||!data)throw new Error("Behavioral practice unavailable.");return mapBehavioralSession(data)}
