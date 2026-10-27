import type { TodayContributions, TodayContext, TodayPlan, TodaySnapshot, TodayTask } from "../types/today.types"
import { dailyStatus } from "./daily-status-service"
import { dayKeyAt, focusByDay, localMinute, weekKeys, shiftDay } from "./day-context"
import { rankTodayTasks } from "./priority-engine"

export function unavailableContributions():TodayContributions {return {revision:{state:"unavailable",tasks:[],dueCount:null,overdueCount:null},focus:{state:"unavailable",segments:[]},readiness:{state:"unavailable",summary:null,detail:null},upcoming:{state:"unavailable",events:[]}}}
export function assembleToday({context,plan,tasks,contributions=unavailableContributions(),now}:{context:TodayContext;plan:TodayPlan|null;tasks:TodayTask[];contributions?:TodayContributions;now:string}):TodaySnapshot {
  const dayKey=dayKeyAt(now,context.timezone)
  if((plan&&(plan.workspaceId!==context.workspaceId||plan.dayKey!==dayKey))||tasks.some(t=>t.workspaceId!==context.workspaceId)||contributions.revision.tasks.some(t=>t.workspaceId!==context.workspaceId)||contributions.focus.segments.some(s=>s.workspaceId!==context.workspaceId)||contributions.upcoming.events.some(e=>e.workspaceId!==context.workspaceId))throw new Error("Today input scope mismatch")
  const week=weekKeys(dayKey),previousWeek=weekKeys(shiftDay(dayKey,-7)),byDay=focusByDay(contributions.focus.segments,context.timezone,[...previousWeek,...week])
  const focusedMinutes=contributions.focus.state==="ready"?byDay[dayKey]:null
  const weeklyMinutes=contributions.focus.state==="ready"?week.reduce((sum,key)=>sum+byDay[key],0):null
  const current=tasks.filter(t=>t.dayKey===dayKey)
  const candidates=[...current,...contributions.revision.tasks.filter(t=>!current.some(existing=>existing.source===t.source&&existing.sourceId===t.sourceId))]
  const rest=plan?.status==="rest"
  const required=current.filter(t=>t.required&&!["deferred","cancelled"].includes(t.status))
  const completed=required.filter(t=>t.status==="completed").length
  const planned=plan?.plannedMinutes||0
  const capacity=Math.min(Math.max(0,1440-localMinute(now,context.timezone)),Math.max(0,context.dailyMinutes-(focusedMinutes||0)))
  const status=dailyStatus({tasks:current,rest,capacityMinutes:capacity,focusedMinutes,plannedMinutes:planned,now})
  const ranked=rankTodayTasks(candidates,{workspaceId:context.workspaceId,dayKey,now,recentTypes:contributions.focus.segments.map(s=>s.type),focusedByType:Object.fromEntries([...new Set(contributions.focus.segments.map(s=>s.type))].map(type=>[type,contributions.focus.segments.filter(s=>s.type===type&&dayKeyAt(s.start,context.timezone)===dayKey).reduce((sum,s)=>sum+Math.max(0,(Date.parse(s.end)-Date.parse(s.start))/60000),0)])),restDay:rest,weeklyBehind:weeklyMinutes!==null&&weeklyMinutes<context.weeklyTargetMinutes*((week.indexOf(dayKey)+1)/7)})
  const stale=!!plan&&(plan.contextVersion!==context.contextVersion||plan.timezone!==context.timezone)
  const state:TodaySnapshot["state"]=stale?"stale":rest?"rest":!plan?(context.hasCurriculum?"no_plan":"no_curriculum"):status.status==="Complete"?"complete":current.some(t=>t.required&&t.status==="skipped")?"recovery":"active"
  const attention:TodaySnapshot["attention"]=[]
  const overdue=tasks.filter(t=>!["completed","deferred","cancelled"].includes(t.status)&&(t.dayKey<dayKey||(t.dueAt&&Date.parse(t.dueAt)<Date.parse(now))))
  if(overdue.length)attention.push({id:"overdue",title:`${overdue.length} task${overdue.length===1?"":"s"} need attention`,detail:"Review missed deadlines and earlier plans. Nothing has been moved silently."})
  if(contributions.revision.dueCount)attention.push({id:"revision",title:`${contributions.revision.dueCount} revisions due`,detail:contributions.revision.overdueCount?`${contributions.revision.overdueCount} overdue. Revision dates remain owned by Revision.`:"A short review can keep previous work within reach."})
  if(status.status==="At Risk"||status.status==="Behind")attention.push({id:"capacity",title:"Make room for what matters",detail:status.reason})
  const events=contributions.upcoming.events.filter(e=>Date.parse(e.at)>=Date.parse(now)).sort((a,b)=>{const tier=(e:typeof a)=>Math.floor((Date.parse(e.at)-Date.parse(now))/86400000)<=1?0:1;return tier(a)-tier(b)||b.importance-a.importance||a.at.localeCompare(b.at)||a.id.localeCompare(b.id)}).slice(0,3)
  return {context,dayKey,generatedAt:now,plan,tasks,ranked,state,status:plan?status.status:null,statusReason:plan?status.reason:"Choose a deliberate plan for the day.",plannedMinutes:planned,focusedMinutes,completedCount:completed,requiredCount:required.length,revision:contributions.revision,readiness:contributions.readiness,week:{days:week.map(day=>({dayKey:day,minutes:contributions.focus.state==="ready"?byDay[day]:null})),focusedMinutes:weeklyMinutes,targetMinutes:context.weeklyTargetMinutes,previousDays:previousWeek.map(day=>({dayKey:day,minutes:contributions.focus.state==="ready"?byDay[day]:null})),previousFocusedMinutes:contributions.focus.state==="ready"?previousWeek.reduce((sum,key)=>sum+byDay[key],0):null},upcoming:{...contributions.upcoming,events},attention}
}
