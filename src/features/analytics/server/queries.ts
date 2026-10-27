import "server-only"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { getMasterySnapshot } from "@/features/mastery/server"
import { logEvent } from "@/lib/observability/logger.server"
import type { Json } from "@/lib/supabase/types"
import type { AnalyticsSnapshot,AnalyticsView,AnalyticsFilters,AnalyticsCore,AnalyticsActivity,AnalyticsInterviews,AnalyticsContext,EvidencePage,Availability } from "../types/analytics.types"
import { analyticsFiltersSchema,evidenceRequestSchema } from "../schemas/analytics.schema"
import { fallbackAnalyticsContext } from "../services/analytics-policy"
import { projectMastery,projectCore } from "../services/source-projection"
import { analyticsInsights } from "../services/insight-engine"
export async function getAnalyticsSnapshot(slug:string,view:AnalyticsView,filters:AnalyticsFilters):Promise<AnalyticsSnapshot>{
 const context=await resolveWorkspace(slug);if(!context?.permissions.canView)throw new Error("Analytics access unavailable.");const validated=analyticsFiltersSchema.parse(filters),db=await createClient(),start=performance.now(),now=new Date().toISOString(),masteryWindow=validated.range==="7d"?7:validated.range==="30d"?30:90;
 const workspace={id:context.workspace.id,slug,name:context.workspace.name,userId:context.membership.userId,timezone:context.workspace.timezone,canEdit:context.workspace.status==="active"},fallback=fallbackAnalyticsContext(workspace,validated,now);
 const results=await Promise.allSettled([
  db.rpc("analytics_core",{p_slug:slug,p_filters:validated as unknown as Json}).then(r=>{if(r.error||!r.data)throw Error("Core unavailable");return r.data as unknown as AnalyticsCore}),
  db.rpc("analytics_activity",{p_slug:slug,p_filters:validated as unknown as Json}).then(r=>{if(r.error||!r.data)throw Error("Activity unavailable");return r.data as unknown as AnalyticsActivity}),
  db.rpc("analytics_interviews",{p_slug:slug,p_filters:validated as unknown as Json,p_limit:view==="interviews"?100:12}).then(r=>{if(r.error||!r.data)throw Error("Interview evidence unavailable");return r.data as unknown as AnalyticsInterviews}),
  ["overview","dsa","topics"].includes(view)?getMasterySnapshot(slug,masteryWindow,false):Promise.resolve(null),
  db.from("topics").select("id,name,track_id").eq("is_active",true).order("name").limit(400),
  db.from("tracks").select("id,name").eq("is_active",true).order("name").limit(30),
 ] as const);
 const rawCore=results[0].status==="fulfilled"?results[0].value:null,activity=results[1].status==="fulfilled"?results[1].value:null,interviews=results[2].status==="fulfilled"?results[2].value:null,rawMastery=results[3].status==="fulfilled"?results[3].value:null;
 const core=rawCore?projectCore(rawCore,view):null,mastery=rawMastery?projectMastery(rawMastery,validated.topic):null;
 for(const source of [core?.context,activity?.context,interviews?.context,mastery?{workspace:mastery.workspace}:null])if(source&&(source.workspace.id!==workspace.id||source.workspace.userId!==workspace.userId))throw new Error("Analytics scope mismatch.");
 const topics=results[4].status==="fulfilled"&&!results[4].value.error?(results[4].value.data||[]).map(t=>({id:t.id,name:t.name,trackId:t.track_id})):core?.topics.filter(t=>t.trackId).map(t=>({id:t.id,name:t.name,trackId:t.trackId!}))||[],tracks=results[5].status==="fulfilled"&&!results[5].value.error?results[5].value.data||[]:[];
 const sources:AnalyticsSnapshot["sources"]={core:core?core.current.eligible?"ready":"empty":"error",activity:activity?"ready":"error",interviews:interviews?"ready":"error",mastery:mastery?"ready":"unavailable"};for(const [key,state]of Object.entries(sources))if(state==="error")logEvent("warn",`analytics.${key}.unavailable`,{code:"unavailable"});
 const snapshot:AnalyticsSnapshot={view,filters:validated,context:core?.context||activity?.context||interviews?.context||fallback,core,activity,interviews,mastery,masteryWindow,sources,catalog:{tracks,topics},insights:[],generatedAt:now,preview:false};snapshot.insights=analyticsInsights(snapshot);const payloadBytes=Buffer.byteLength(JSON.stringify(snapshot));logEvent(payloadBytes>350000?"warn":"info","analytics.snapshot.loaded",{durationMs:performance.now()-start,payloadBytes,pointCount:core?.points.length||0,view});return snapshot
}
export async function getAnalyticsEvidence(input:unknown):Promise<EvidencePage>{const {slug,filters,metric,cursor}=evidenceRequestSchema.parse(input),context=await resolveWorkspace(slug);if(!context?.permissions.canView)throw Error("Analytics access unavailable.");const db=await createClient(),{data,error}=await db.rpc("analytics_history",{p_slug:slug,p_filters:filters as unknown as Json,p_metric:metric,p_cursor:cursor as unknown as Json});if(error||!data)throw Error("Evidence history unavailable.");const result=data as unknown as EvidencePage;if(result.context.workspace.id!==context.workspace.id||result.context.workspace.userId!==context.membership.userId)throw Error("Analytics scope mismatch.");return result}
export function analyticsSourceState(value:unknown):Availability{return value?"ready":"unavailable"}
export type { AnalyticsContext }
