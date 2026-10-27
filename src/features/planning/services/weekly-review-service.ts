import { dayLoad, unfinished } from "./capacity-service"
import type { PlanningSnapshot } from "../types/planning.types"

export function weeklyObservations(snapshot:Pick<PlanningSnapshot,"days"|"goals"|"carryover"|"evidence">):string[] {
  const tasks=snapshot.days.flatMap(day=>day.tasks),active=tasks.filter(task=>!["deferred","cancelled"].includes(task.status)),completed=active.filter(task=>task.status==="completed").length
  const planned=snapshot.days.reduce((sum,day)=>sum+dayLoad(day),0),capacity=snapshot.days.reduce((sum,day)=>sum+day.capacity,0),overloaded=snapshot.days.filter(day=>dayLoad(day)>day.capacity)
  const items=[active.length?`${completed} of ${active.length} scheduled tasks are complete.`:"This week has no scheduled tasks yet.",`${planned} minutes are planned against ${capacity} minutes of available capacity.`]
  if(overloaded.length)items.push(`${overloaded.length} day${overloaded.length===1?" is":"s are"} over capacity. Review the plan before adding work.`)
  if(snapshot.carryover.length)items.push(`${snapshot.carryover.length} earlier task${snapshot.carryover.length===1?" needs":"s need"} an explicit carryover decision.`)
  if(tasks.some(task=>task.carryoverCount>=2&&unfinished(task)))items.push("Repeated carryover is present. Reduce the task or reconsider its priority.")
  if(snapshot.evidence.focus!=="ready")items.push("Focused time is unavailable; task estimates are not counted as study time.")
  return items
}
export function canCloseWeek(snapshot:PlanningSnapshot) {return snapshot.context.today>snapshot.days[6].day&&!snapshot.review&&!snapshot.days.flatMap(day=>day.tasks).some(task=>task.required&&unfinished(task))}
