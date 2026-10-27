import "server-only"
import { resolveWorkspace } from "@/features/workspaces/server"
import { createClient } from "@/lib/supabase/server"
import { dayKeyAt } from "@/lib/time/workspace-calendar"
import { analyticsFiltersSchema } from "../schemas/analytics.schema"
import type { AnalyticsView } from "../types/analytics.types"
import { getAnalyticsSnapshot } from "./queries"
import { analyticsPreview } from "./preview-data"
export async function analyticsRouteSnapshot(slug:string,view:AnalyticsView,search:Record<string,string|string[]|undefined>,preview=false){
 const values=Object.fromEntries(Object.entries(search).map(([k,v])=>[k,Array.isArray(v)?v[0]:v])),parsed=analyticsFiltersSchema.safeParse({...values,compare:values.compare!=="false"})
 let filters=parsed.success?parsed.data:analyticsFiltersSchema.parse({}),warning=parsed.success?undefined:"Some URL filters were invalid. The default complete-day range is shown."
 const context=preview?null:await resolveWorkspace(slug);if(!preview&&!context?.permissions.canView)throw Error("Analytics access unavailable.")
 if(filters.range==="custom"&&filters.to!>dayKeyAt(new Date().toISOString(),context?.workspace.timezone||"Asia/Calcutta")){filters=analyticsFiltersSchema.parse({});warning="Future dates are not supported. The default complete-day range is shown."}
 const snapshot=preview?analyticsPreview(view,filters,new Date().toISOString()):await getAnalyticsSnapshot(slug,view,filters)
 return {...snapshot,filterWarning:warning}
}
/** Opens Planning's existing explicit-save editor; Analytics never writes a task. */
export async function getAnalyticsPlanningTitle(slug:string,topicId:string){if(!/^[a-zA-Z0-9_-]{1,200}$/.test(topicId))return null;const context=await resolveWorkspace(slug);if(!context?.permissions.canView)return null;const db=await createClient(),{data}=await db.from("topics").select("name").eq("id",topicId).eq("is_active",true).maybeSingle();return data?`Focused practice · ${data.name}`:null}
