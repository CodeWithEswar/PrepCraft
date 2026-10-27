import { getLearningCandidates } from "@/lib/learning/read-candidates.server"
import { getBehavioralCandidates } from "@/lib/behavioral/read-candidates.server"
import "server-only"
import { getMasteryActionCandidates } from "@/features/mastery/server"
import { getRevisionTodayContribution } from "@/features/revision/server"
import { createClient } from "@/lib/supabase/server"
import { logEvent } from "@/lib/observability/logger.server"
import { resolveWorkspace } from "@/features/workspaces/server"
import type { WorkspaceContext } from "@/features/workspaces"
import type { DailyTaskRow } from "@/lib/supabase/today.types"
import { assembleToday } from "../services/today-service"
import { loadTodayContributions, type TodayDomainPorts } from "../services/domain-ports"
import { dayKeyAt, shiftDay } from "../services/day-context"
import { readWorkspaceExecutionFocus,readWorkspaceExecutionTaskLinks } from "@/lib/execution/read-focus.server"
import { resolveDayCapacity } from "@/lib/time/planning-capacity"
import type { TodayContext, TodayPlan, TodaySnapshot, TodayTask } from "../types/today.types"

export function contextFingerprint(context:WorkspaceContext,curriculumUpdatedAt:string|null,preferencesUpdatedAt:string|null) {
  return [context.workspace.timezone,context.target?Date.parse(context.target.updatedAt):0,preferencesUpdatedAt?Date.parse(preferencesUpdatedAt):0,curriculumUpdatedAt?Date.parse(curriculumUpdatedAt):0].join("|")
}
export async function getTodaySnapshot(slug:string,authorizedContext?:WorkspaceContext,ports:TodayDomainPorts={}):Promise<TodaySnapshot> {
  const start=performance.now()
  const context=authorizedContext||await resolveWorkspace(slug)
  if(!context||context.workspace.slug!==slug||!context.permissions.canView)throw new Error("Workspace access unavailable")
  const db=await createClient(),now=new Date().toISOString(),dayKey=dayKeyAt(now,context.workspace.timezone)
  const workspaceId=context.workspace.id
  const learningPromise=getLearningCandidates(slug).catch(()=>{logEvent("warn","today.learning.unavailable",{code:"unavailable"});return null})
  const behavioralPromise=getBehavioralCandidates(slug,workspaceId).catch(()=>{logEvent("warn","today.behavioral.unavailable",{code:"unavailable"});return null})
  const masteryPromise=getMasteryActionCandidates(slug).catch(()=>{logEvent("warn","today.mastery.unavailable",{code:"unavailable"});return null})
  const [plansResult,curriculumResult,preferencesResult,availabilityResult,overrideResult]=await Promise.all([
    db.from("daily_plans").select("*").eq("workspace_id",workspaceId).gte("plan_date",shiftDay(dayKey,-30)).lte("plan_date",dayKey).order("plan_date",{ascending:false}),
    db.from("workspace_curricula").select("id,updated_at").eq("workspace_id",workspaceId).maybeSingle(),
    db.from("workspace_preferences").select("updated_at").eq("workspace_id",workspaceId).maybeSingle(),
    db.from("planning_availability").select("*").eq("workspace_id",workspaceId),
    db.from("planning_availability_overrides").select("*").eq("workspace_id",workspaceId).eq("plan_date",dayKey),
  ])
  if(plansResult.error||curriculumResult.error||preferencesResult.error){
    const failingError = plansResult.error || curriculumResult.error || preferencesResult.error
    logEvent("error","today.snapshot.failed",{code:"unavailable",error:failingError?.message,durationMs:performance.now()-start})
    throw new Error("Today's plan could not be loaded. Please try again.")
  }
  const availabilityRules=(!availabilityResult.error&&availabilityResult.data)?availabilityResult.data:[]
  const overrideRules=(!overrideResult.error&&overrideResult.data)?overrideResult.data:[]
  if(availabilityResult.error){logEvent("warn","today.availability.unavailable",{code:availabilityResult.error.code,error:availabilityResult.error.message})}
  if(overrideResult.error){logEvent("warn","today.overrides.unavailable",{code:overrideResult.error.code,error:overrideResult.error.message})}
  const plans=plansResult.data||[]
  const current=plans.find(p=>p.plan_date===dayKey)
  const earlierIds=plans.filter(p=>p.plan_date<dayKey&&p.lifecycle!=="closed").map(p=>p.id)
  const [todayTasks,earlierTasks]=await Promise.all([
    current?db.from("daily_tasks").select("*").eq("workspace_id",workspaceId).eq("daily_plan_id",current.id).order("sort_order").limit(100):Promise.resolve({data:[],error:null}),
    earlierIds.length?db.from("daily_tasks").select("*").eq("workspace_id",workspaceId).in("daily_plan_id",earlierIds).in("status",["planned","in_progress","skipped"]).order("created_at").limit(100):Promise.resolve({data:[],error:null}),
  ])
  if(todayTasks.error||earlierTasks.error)throw new Error("Today's tasks could not be loaded. Please try again.")
  const taskRows=[...(todayTasks.data||[]),...(earlierTasks.data||[])]
  let executionLinks:Awaited<ReturnType<typeof readWorkspaceExecutionTaskLinks>>=[]
  try{executionLinks=await readWorkspaceExecutionTaskLinks(workspaceId,taskRows.map(task=>task.id))}catch{logEvent("warn","today.execution_links.unavailable",{code:"unavailable"})}
  const mapTask=(row:DailyTaskRow):TodayTask=>({id:row.id,workspaceId:row.workspace_id,planId:row.daily_plan_id,dayKey:plans.find(p=>p.id===row.daily_plan_id)!.plan_date,title:row.title,notes:row.notes,type:row.task_type as TodayTask["type"],source:row.source_type as TodayTask["source"],sourceId:row.source_id,estimatedMinutes:row.estimated_minutes,required:row.required,status:row.status as TodayTask["status"],dueAt:row.due_at,order:row.sort_order,createdAt:row.created_at,startedAt:row.started_at,completedAt:row.completed_at,version:row.version,evidence:executionLinks.some(link=>link.task_id===row.id)?{resumable:true,href:`/w/${slug}/session/${executionLinks.find(link=>link.task_id===row.id)!.session_id}`,sessionPhase:(["active","paused"].includes(executionLinks.find(link=>link.task_id===row.id)!.status)?"active":"reflection")}:undefined})
  const dayCapacity=resolveDayCapacity(dayKey,context.preferences,availabilityRules.map(rule=>({weekday:rule.weekday,minutes:rule.minutes,rest:rule.rest,start:rule.start_time,end:rule.end_time})),overrideRules.map(rule=>({day:rule.plan_date,minutes:rule.minutes,rest:rule.rest,start:rule.start_time,end:rule.end_time})),current?.status as "active"|"rest"|undefined)
  const todayContext:TodayContext={workspaceId,slug,name:context.workspace.name,timezone:context.workspace.timezone,interviewLanguage:context.target?.interviewLanguage,role:context.target?.customRoleName||context.target?.roleName||"Preparation workspace",company:context.target?.companyName||context.target?.customCompanyName||null,targetDate:context.target?.targetDate||null,weeklyTargetMinutes:context.preferences.weeklyTargetMinutes,dailyMinutes:dayCapacity.capacity,studyDays:context.preferences.studyDays,hasCurriculum:!!curriculumResult.data||!!context.target?.templateId,contextVersion:contextFingerprint(context,curriculumResult.data?.updated_at||null,preferencesResult.data?.updated_at||null),canEdit:context.workspace.status==="active"&&context.membership.status==="active"}
  const plan:TodayPlan|null=current?{id:current.id,workspaceId,dayKey:current.plan_date,timezone:current.timezone,status:current.status as TodayPlan["status"],plannedMinutes:current.planned_minutes,contextVersion:current.context_version,createdAt:current.created_at}:null
  // Explicit unavailable adapters until authoritative source features are implemented.
  // No query to a speculative table and no substitution of task estimates for focus time.
  const contributions=await loadTodayContributions({...ports,revision:ports.revision||(()=>getRevisionTodayContribution(slug)),focus:ports.focus||(async scope=>({state:"ready",segments:await readWorkspaceExecutionFocus(scope.workspaceId,`${shiftDay(scope.dayKey,-16)}T00:00:00Z`,scope.now)}))},{workspaceId,dayKey,timezone:context.workspace.timezone,now})
  for(const key of ["revision","focus","readiness","upcoming"] as const)if(contributions[key].state==="error")logEvent("warn",`today.${key}.unavailable`,{code:"unavailable"})
  const snapshot=assembleToday({context:todayContext,plan,tasks:(taskRows||[]).map(mapTask),contributions,now})
  const learning=await learningPromise
  const behavioral=await behavioralPromise
  if(!dayCapacity.rest&&plan?.status!=="rest"&&behavioral?.workspaceId===workspaceId)for(const candidate of behavioral.actions)snapshot.attention.push({id:`behavioral:${candidate.id}`,title:candidate.title,detail:candidate.detail,href:candidate.href})
  if(plan?.status!=="rest"&&learning?.workspaceId===workspaceId)for(const candidate of learning.actions)snapshot.attention.push({id:`learning:${candidate.id}`,title:candidate.title,detail:candidate.detail,href:candidate.href})
  const mastery=await masteryPromise
  if(plan?.status!=="rest"&&mastery?.workspaceId===workspaceId&&mastery.actions[0]){const candidate=mastery.actions[0];snapshot.attention.push({id:"mastery",title:candidate.action.title,detail:candidate.action.reasons[0],href:candidate.action.href})}
  logEvent("info","today.snapshot.loaded",{durationMs:performance.now()-start})
  return snapshot
}
