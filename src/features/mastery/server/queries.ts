import "server-only"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { getWorkspaceCurriculum } from "@/features/templates/server"
import { logEvent } from "@/lib/observability/logger.server"
import { calculateMastery,MASTERY_POLICY } from "../policies/mastery-policy-v1"
import type { MasteryArea,MasteryEvidence,MasterySnapshot,EvidenceSpineRow } from "../types/mastery.types"
import type { Json } from "@/lib/supabase/types"
export async function getMasterySnapshot(slug:string,days:MasterySnapshot["days"]=90,includeComparison=true):Promise<MasterySnapshot>{
 if(![7,30,90,365].includes(days))throw new Error("Unsupported evidence window")
 const context=await resolveWorkspace(slug);if(!context?.permissions.canView)throw new Error("Mastery access unavailable")
 const start=performance.now(),db=await createClient(),now=new Date().toISOString(),previous=new Date(Date.parse(now)-14*86400000).toISOString()
 const [curriculum,current,prior]=await Promise.all([getWorkspaceCurriculum(context.workspace.id),db.rpc("mastery_evidence",{p_slug:slug,p_days:days}),includeComparison?db.rpc("mastery_evidence",{p_slug:slug,p_days:days,p_at:previous}):Promise.resolve({data:null,error:null})])
 if(current.error||!current.data){logEvent("error","mastery.evidence.failed",{code:current.error?.code||"empty"});throw new Error("Mastery evidence could not be loaded.")}
 const evidence=current.data as unknown as MasteryEvidence,old=!prior.error&&prior.data?prior.data as unknown as MasteryEvidence:null
 if(evidence.workspaceId!==context.workspace.id||evidence.userId!==context.membership.userId)throw new Error("Mastery scope mismatch")
 const areas:MasteryArea[]=curriculum?curriculum.tracks.flatMap(track=>[...track.topics.map(topic=>({id:topic.topicId,kind:"topic" as const,name:topic.name,trackId:track.trackId,trackName:track.name,priority:topic.priority,required:track.required&&["core","high"].includes(topic.priority)})),...track.patterns.map(pattern=>({id:pattern.patternId,kind:"pattern" as const,name:pattern.name,trackId:track.trackId,trackName:track.name,priority:pattern.priority,required:track.required&&["core","high"].includes(pattern.priority)}))]):[]
 for(const area of evidence.areas||[])if(!areas.some(a=>a.id===area.id)&&evidence.groups.some(g=>g.entity_type==="topic"&&g.entity_id===area.id))areas.push({...area,kind:"topic",priority:"optional",required:false})
 const calculatedAt=evidence.asOf
 const results=areas.slice(0,200).map(area=>{const aggregate=evidence.groups.find(row=>row.entity_type===area.kind&&row.entity_id===area.id)||null,result=calculateMastery(area,aggregate,{now:calculatedAt,days,slug});if(old){try{result.previousLevel=calculateMastery(area,old.groups.find(row=>row.entity_type===area.kind&&row.entity_id===area.id)||null,{now:previous,days,slug}).level;result.comparisonAvailable=true}catch{logEvent("warn","mastery.comparison.unavailable",{code:"invalid_evidence"})}}return result})
 logEvent("info","mastery.snapshot.loaded",{durationMs:performance.now()-start,count:results.length})
 return {workspace:{id:context.workspace.id,slug,userId:context.membership.userId,timezone:context.workspace.timezone,name:context.workspace.name,canEdit:context.workspace.status==="active"},days,generatedAt:calculatedAt,policyVersion:MASTERY_POLICY.version,results,totals:evidence.totals,unmapped:evidence.unmapped,historyState:old?"ready":"unavailable",sources:{attempts:"ready",revision:"ready",mistakeJournal:"unavailable"},truncated:areas.length>200||evidence.groups.length>400||Boolean(evidence.truncated)}
}
export async function getMasterySpine(slug:string,kind:"topic"|"pattern",id:string,cursor:{at:string;id:string}|null){
 const context=await resolveWorkspace(slug);if(!context?.permissions.canView)throw new Error("Mastery access unavailable")
 const db=await createClient(),{data,error}=await db.rpc("mastery_spine",{p_slug:slug,p_type:kind,p_entity:id,p_before:cursor as unknown as Json})
 if(error)throw new Error("Evidence history is temporarily unavailable.")
 const rows=data as unknown as EvidenceSpineRow[],last=rows[29]
 return {rows:rows.slice(0,30),cursor:rows.length>30&&last?{at:last.completed_at,id:last.id}:null}
}
/** Read-only integration contract. No Today task or readiness score is created. */
export async function getMasteryActionCandidates(slug:string){const s=await getMasterySnapshot(slug,90,false);return {workspaceId:s.workspace.id,policy:s.policyVersion,actions:s.results.filter(result=>result.weaknesses.length&&["moderate","strong"].includes(result.evidenceConfidence)).toSorted((a,b)=>b.action.priority-a.action.priority||a.area.id.localeCompare(b.area.id)).slice(0,5).map(result=>({entity:result.area,confidence:result.evidenceConfidence,reasons:result.weaknesses.map(weakness=>weakness.code),action:result.action}))}}
