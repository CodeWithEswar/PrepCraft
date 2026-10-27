"use server"
import "server-only"
import { getAnalyticsEvidence } from "./queries"
import { logEvent } from "@/lib/observability/logger.server"
import type { EvidencePage } from "../types/analytics.types"
export async function loadAnalyticsEvidenceAction(input:unknown):Promise<{ok:true;data:EvidencePage}|{ok:false;error:string}>{const start=performance.now();try{const data=await getAnalyticsEvidence(input);logEvent("info","analytics.evidence.loaded",{durationMs:performance.now()-start});return {ok:true,data}}catch{logEvent("warn","analytics.evidence.unavailable",{code:"unavailable"});return {ok:false,error:"This evidence could not be loaded. Your other analytics remain available."}}}
