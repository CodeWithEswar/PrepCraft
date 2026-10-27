"use server"
import "server-only"
import { analyticsPreview } from "./preview-data"
import { evidenceRequestSchema } from "../schemas/analytics.schema"
import type { EvidencePage } from "../types/analytics.types"
export async function previewAnalyticsEvidenceAction(input:unknown):Promise<{ok:true;data:EvidencePage}|{ok:false;error:string}>{const p=evidenceRequestSchema.safeParse(input);if(!p.success)return {ok:false,error:"Check the example evidence filters."};const v=p.data,s=analyticsPreview("timing",v.filters),rows=(s.core?.points||[]).filter(r=>!v.cursor||r.at<v.cursor.at||r.at===v.cursor.at&&r.id<v.cursor.id).filter(r=>v.metric==="independent"?r.result==="independent":v.metric==="assisted"?r.result==="assisted":v.metric==="timing"?r.result!=="unsolved":v.metric==="objective"?r.correct!==null:true).toSorted((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id));return {ok:true,data:{rows:rows.slice(0,30),cursor:rows.length>30?{at:rows[29].at,id:rows[29].id}:null,context:s.context,metric:v.metric}}}
