import "server-only"
import { getRevisionQueue } from "./queries"
import { DEFAULT_FILTERS } from "../types/revision.types"
import { dayKeyAt } from "@/lib/time/workspace-calendar-core"
import { revisionReasons } from "../services/revision-priority"
/** Read-only candidates. No daily_tasks rows or learning dates are created by Today. */
export async function getRevisionTodayContribution(slug:string){
 const s=await getRevisionQueue(slug,{...DEFAULT_FILTERS,state:"due"}),day=dayKeyAt(s.serverNow,s.workspace.timezone)
 return {state:"ready" as const,dueCount:s.summary.due,overdueCount:s.summary.overdue,tasks:s.items.slice(0,10).map((item,index)=>({id:item.id,workspaceId:s.workspace.id,planId:"revision-source",dayKey:day,title:item.title,notes:revisionReasons(item,s.serverNow,s.workspace.timezone).map(reason=>reason.label).join(" · "),type:"revision" as const,source:"revision" as const,sourceId:item.id,estimatedMinutes:item.estimated_duration_ms?Math.ceil(item.estimated_duration_ms/60000):0,required:true,status:"planned" as const,dueAt:item.due_at,order:index,createdAt:item.created_at,startedAt:null,completedAt:null,version:item.version,evidence:{revisionState:dayKeyAt(item.due_at,s.workspace.timezone)<day?"overdue" as const:"today" as const,href:`/w/${slug}/revision/${item.id}`}}))}
}
/** Forecast is a due-date contract, never a generated plan or a promise of future reviews. */
export async function getRevisionPlanningForecast(slug:string){const s=await getRevisionQueue(slug);return {workspaceId:s.workspace.id,days:s.horizon,policy:"revision-policy-v1" as const}}
