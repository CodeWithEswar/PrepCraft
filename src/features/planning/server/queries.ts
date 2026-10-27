import "server-only"
import { getRevisionPlanningForecast } from "@/features/revision/server"
import { readWorkspaceExecutionFocus } from "@/lib/execution/read-focus.server"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { getWorkspaceCurriculum } from "@/features/templates/server"
import type { WorkspaceContext } from "@/features/workspaces"
import { dayKeyAt, weekKeys, shiftDay, daysBetween } from "@/lib/time/workspace-calendar"
import { buildDays } from "../services/capacity-service"
import { weeklyObservations } from "../services/weekly-review-service"
import { emptyPlanning } from "../services/planning-service"
import { loadPlanningEvidence,type PlanningEvidencePorts } from "../services/planning-evidence"
import type { DailyTaskRow } from "@/lib/supabase/today.types"
/** Resolve a notification source into the existing shared plan, under live membership. */
export async function getPlanningTaskDay(slug:string,id:string){if(!/^[0-9a-f-]{36}$/i.test(id))return undefined;const context=await resolveWorkspace(slug);if(!context?.permissions.canView)return undefined;const db=await createClient(),task=await db.from("daily_tasks").select("daily_plan_id").eq("workspace_id",context.workspace.id).eq("id",id).maybeSingle();if(task.error||!task.data)return undefined;const plan=await db.from("daily_plans").select("plan_date").eq("workspace_id",context.workspace.id).eq("id",task.data.daily_plan_id).maybeSingle();return plan.error?undefined:plan.data?.plan_date}
import type { PlanningSnapshot, PlanningTask, PlanningContext, WeeklyGoal, CurriculumWork, PlanningReview } from "../types/planning.types"

export async function getPlanningSnapshot(slug:string,requestedWeek?:string,authorizedContext?:WorkspaceContext,ports:PlanningEvidencePorts={}):Promise<PlanningSnapshot> {
  const context=authorizedContext||await resolveWorkspace(slug)
  if(!context||context.workspace.slug!==slug||!context.permissions.canView)throw new Error("Workspace access unavailable")
  const db=await createClient(),now=new Date().toISOString(),today=dayKeyAt(now,context.workspace.timezone),week=weekKeys(requestedWeek||today)[0]
  if(!/^\d{4}-\d{2}-\d{2}$/.test(week)||Math.abs(daysBetween(today,week))>730)throw new Error("Choose a week within two years of today.")
  // Read a version before and after the bounded aggregate. Any intervening mutation forces a retry.
  const revisionBefore=await db.from("planning_state").select("revision").eq("workspace_id",context.workspace.id).maybeSingle()
  if(revisionBefore.error)throw new Error("Planning is temporarily unavailable.")
  const workspaceId=context.workspace.id
  const [plans,rules,overrides,goals,reviews,curriculum,metadata,prefs]=await Promise.all([
    db.from("daily_plans").select("*").eq("workspace_id",workspaceId).gte("plan_date",shiftDay(week,-365)).lte("plan_date",shiftDay(week,6)).order("plan_date"),
    db.from("planning_availability").select("*").eq("workspace_id",workspaceId),
    db.from("planning_availability_overrides").select("*").eq("workspace_id",workspaceId).gte("plan_date",week).lte("plan_date",shiftDay(week,6)),
    db.from("weekly_goals").select("*").eq("workspace_id",workspaceId).eq("week_start",week).maybeSingle(),
    db.from("weekly_reviews").select("*").eq("workspace_id",workspaceId).eq("week_start",week).maybeSingle(),
    getWorkspaceCurriculum(workspaceId),
    db.from("workspace_curricula").select("updated_at").eq("workspace_id",workspaceId).maybeSingle(),
    db.from("workspace_preferences").select("updated_at").eq("workspace_id",workspaceId).maybeSingle(),
  ])
  if([plans,rules,overrides,goals,reviews,metadata,prefs].some(result=>result.error))throw new Error("The weekly plan could not be loaded.")
  const selected=plans.data!.filter(plan=>plan.plan_date>=week),earlier=plans.data!.filter(plan=>plan.plan_date<today&&plan.plan_date<week)
  const [taskResult,carryResult,items,revisionAfter]=await Promise.all([
    selected.length?db.from("daily_tasks").select("*").eq("workspace_id",workspaceId).in("daily_plan_id",selected.map(plan=>plan.id)).order("sort_order").limit(701):Promise.resolve({data:[],error:null}),
    earlier.some(plan=>plan.lifecycle!=="closed")?db.from("daily_tasks").select("*").eq("workspace_id",workspaceId).in("daily_plan_id",earlier.filter(plan=>plan.lifecycle!=="closed").map(plan=>plan.id)).in("status",["planned","in_progress","skipped"]).order("created_at").limit(201):Promise.resolve({data:[],error:null}),
    goals.data?db.from("weekly_goal_items").select("*").eq("workspace_id",workspaceId).eq("weekly_goal_id",goals.data.id).order("created_at"):Promise.resolve({data:[],error:null}),
    db.from("planning_state").select("revision").eq("workspace_id",workspaceId).maybeSingle(),
  ])
  if([taskResult,carryResult,items,revisionAfter].some(result=>result.error))throw new Error("Planning details could not be loaded.")
  if((revisionBefore.data?.revision||0)!==(revisionAfter.data?.revision||0))throw new Error("The plan changed while loading. Refresh to see the latest week.")
  if(taskResult.data!.length>700||carryResult.data!.length>200)throw new Error("This plan needs a narrower review before it can be edited.")
  const fingerprint=[context.workspace.timezone,context.target?Date.parse(context.target.updatedAt):0,prefs.data?Date.parse(prefs.data.updated_at):0,metadata.data?Date.parse(metadata.data.updated_at):0].join("|")
  const planningContext:PlanningContext={workspaceId,slug,name:context.workspace.name,timezone:context.workspace.timezone,today,company:context.target?.companyName||context.target?.customCompanyName||null,role:context.target?.customRoleName||context.target?.roleName||"Preparation",targetDate:context.target?.targetDate||null,canEdit:context.workspace.status==="active"&&context.permissions.canEditSchedule,weeklyTargetMinutes:context.preferences.weeklyTargetMinutes,defaultDailyMinutes:context.preferences.defaultDailyMinutes,studyDays:context.preferences.studyDays,curriculumVersion:curriculum?`${curriculum.templateVersionId}:${curriculum.versionNumber}`:"none",contextVersion:fingerprint,hasCurriculum:!!curriculum}
  const mapTask=(row:DailyTaskRow):PlanningTask=>({id:row.id,workspaceId,planId:row.daily_plan_id,day:plans.data!.find(plan=>plan.id===row.daily_plan_id)!.plan_date,title:row.title,notes:row.notes,type:row.task_type as PlanningTask["type"],source:row.source_type as PlanningTask["source"],sourceId:row.source_id,minutes:row.estimated_minutes,required:row.required,status:row.status as PlanningTask["status"],order:row.sort_order,version:row.version,dueAt:row.due_at,scheduledStart:row.scheduled_start,scheduledEnd:row.scheduled_end,trackId:row.track_id,topicId:row.topic_id,targetCount:row.target_count,targetUnit:row.target_unit as PlanningTask["targetUnit"],carryoverFromId:row.carryover_from_task_id,carryoverCount:row.carryover_count,generationKey:row.generation_key})
  const snapshot=emptyPlanning(planningContext,now,week)
  snapshot.revision=revisionAfter.data?.revision||0
  snapshot.rules=rules.data!.map(rule=>({weekday:rule.weekday,minutes:rule.minutes,rest:rule.rest,start:rule.start_time?.slice(0,5)||null,end:rule.end_time?.slice(0,5)||null}))
  snapshot.overrides=overrides.data!.map(rule=>({day:rule.plan_date,minutes:rule.minutes,rest:rule.rest,start:rule.start_time?.slice(0,5)||null,end:rule.end_time?.slice(0,5)||null}))
  snapshot.days=buildDays(week,planningContext,snapshot.rules,snapshot.overrides,taskResult.data!.map(mapTask),selected.map(plan=>({id:plan.id,day:plan.plan_date,rest:plan.status==="rest",closed:plan.lifecycle==="closed"})))
  snapshot.goals=items.data!.map(item=>({id:item.id,title:item.title,kind:item.goal_type as WeeklyGoal["kind"],unit:item.unit as WeeklyGoal["unit"],target:item.target,trackId:item.track_id,progress:null}))
  snapshot.carryover=[...carryResult.data!.map(mapTask),...snapshot.days.flatMap(day=>day.tasks).filter(task=>task.day<today&&["planned","in_progress","skipped"].includes(task.status))]
  snapshot.curriculum=curriculum?curriculum.tracks.flatMap(track=>track.topics.map(topic=>({id:topic.topicId,trackId:track.trackId,title:topic.name,trackName:track.name,priority:topic.priority,type:inferTaskType(track.name),weight:track.weight}))):[]
  if(reviews.data)snapshot.review={week,notes:reviews.data.notes,closedAt:reviews.data.closed_at,summary:reviews.data.summary as unknown as PlanningReview["summary"]}
  const focusFrom=week<shiftDay(today,-56)?week:shiftDay(today,-56)
  const evidence=await loadPlanningEvidence({...ports,focus:ports.focus||(async scope=>readWorkspaceExecutionFocus(scope.workspaceId,`${shiftDay(focusFrom,-2)}T00:00:00Z`,scope.now))},{workspaceId,timezone:planningContext.timezone,from:week,to:shiftDay(week,6),now},[...new Set([...snapshot.focusDays.map(day=>day.day),...snapshot.days.map(day=>day.day)])])
  snapshot.evidence=evidence.state
  if(!ports.revision){try{const forecast=await getRevisionPlanningForecast(slug);if(forecast.workspaceId!==workspaceId)throw new Error("Revision scope mismatch");snapshot.revisionForecast=forecast.days.filter(day=>day.day>=week&&day.day<=shiftDay(week,6));snapshot.evidence.revision="ready"}catch{snapshot.evidence.revision="error"}}
  if(evidence.revision.some(obligation=>!snapshot.days.flatMap(day=>day.tasks).some(task=>task.id===obligation.projectionId&&task.source==="revision")))snapshot.evidence.revision="error"
  snapshot.curriculum=snapshot.curriculum.map(topic=>({...topic,weakness:evidence.mastery.find(row=>row.topicId===topic.id)?.weakness}))
  snapshot.focusDays=snapshot.focusDays.map(day=>({...day,minutes:evidence.focus?evidence.focus[day.day]||0:null}))
  snapshot.upcoming.push(...evidence.upcoming.map(event=>({id:event.id,title:event.title,day:event.day,kind:event.kind})))
  for(const goal of snapshot.goals)if(goal.kind==="study_time"&&evidence.focus)goal.progress=snapshot.days.reduce((sum,day)=>sum+(evidence.focus![day.day]||0),0)
  snapshot.observations=weeklyObservations(snapshot)
  return snapshot
}
function inferTaskType(name:string):CurriculumWork["type"]{const value=name.toLowerCase();return /dsa|algorithm|data structure/.test(value)?"dsa":/behavior/.test(value)?"behavioral":/aptitude/.test(value)?"aptitude":/project/.test(value)?"projects":/language/.test(value)?"language":/timed/.test(value)?"timed_practice":"fundamentals"}
