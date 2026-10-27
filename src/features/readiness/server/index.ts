import "server-only"
import { resolveWorkspace } from "@/features/workspaces/server"
import { getMasterySnapshot } from "@/features/mastery/server"
import { createClient } from "@/lib/supabase/server"
import { READINESS_POLICY,masteryDomain,interviewDomain,type AreaEvidence } from "../policy"
import { z } from "zod"
const interviewsSchema=z.object({oa:z.object({n:z.number().int().nonnegative()}),behavioral:z.object({n:z.number().int().nonnegative()}),mocks:z.array(z.unknown()),mockState:z.enum(["ready","empty","unavailable"])})
export async function getReadiness(slug:string){
 const context=await resolveWorkspace(slug);if(!context?.permissions.canView)throw Error("Preparation evidence is unavailable.")
 const db=await createClient(),results=await Promise.allSettled([getMasterySnapshot(slug,90,false),db.rpc("analytics_interviews",{p_slug:slug,p_filters:{range:"90d",track:"all",topic:"all",difficulty:"all"},p_limit:100}).then(({data,error})=>{if(error)throw Error("Source unavailable");return interviewsSchema.parse(data)})] as const),mastery=results[0].status==="fulfilled"?results[0].value:null,interviews=results[1].status==="fulfilled"?results[1].value:null,base=`/w/${slug}`,now=new Date()
 if(mastery&&(mastery.workspace.id!==context.workspace.id||mastery.workspace.userId!==context.membership.userId))throw Error("Readiness scope mismatch")
 const areas:AreaEvidence[]|null=mastery?mastery.results.filter(r=>r.area.kind==="topic").map(r=>({name:r.area.name,trackId:r.area.trackId,level:r.level,confidence:r.evidenceConfidence,attempts:r.aggregate?.attempts||0,lastAt:r.aggregate?.last_at||null,required:r.area.required,nextHref:r.action.href})):null
 const inTracks=(ids:string[])=>areas?.filter(a=>ids.includes(a.trackId))??null
 return {workspace:{id:context.workspace.id,userId:context.membership.userId,slug},policyVersion:READINESS_POLICY,generatedAt:now.toISOString(),windowDays:90,overallScore:null,weighting:"Not applied: a complete versioned role weighting contract is not available.",sourceTruncated:mastery?.truncated||false,domains:[
  masteryDomain("dsa","DSA & problem solving",inTracks(["dsa"]),base+"/practice",now),
  masteryDomain("language","Interview language",inTracks(["programming-language"]),base+"/learn/java",now),
  masteryDomain("fundamentals","CS fundamentals",inTracks(["cs-fundamentals","databases-sql"]),base+"/learn",now),
  interviewDomain("oa","Timed assessments",interviews?.oa.n??null,base+"/practice?focus=timed"),
  interviewDomain("behavioral","Behavioral preparation",interviews?.behavioral.n??null,base+"/interview/behavioral",true),
  interviewDomain("mock","Mock interviews",interviews&&interviews.mockState!=="unavailable"?interviews.mocks.length:null,base+"/interview/mocks"),
  interviewDomain("projects","Project discussion",null,base+"/interview?focus=projects")
 ]}
}
