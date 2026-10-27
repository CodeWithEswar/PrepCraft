import { weekKeys } from "@/lib/time/workspace-calendar"
import { resolveDayCapacity } from "@/lib/time/planning-capacity"
import type { AvailabilityRule, AvailabilityOverride, PlanningContext, PlanningDay, PlanningTask } from "../types/planning.types"

export const consumesCapacity=(task:PlanningTask)=>!(["deferred","cancelled","skipped"] as string[]).includes(task.status)
export const unfinished=(task:PlanningTask)=>["planned","in_progress","skipped"].includes(task.status)
export function resolveCapacity(day:string,context:Pick<PlanningContext,"studyDays"|"defaultDailyMinutes">,rules:AvailabilityRule[],overrides:AvailabilityOverride[],planStatus?: "active" | "rest" | null) {
  return resolveDayCapacity(day,context,rules,overrides,planStatus)
}
export function buildDays(week:string,context:PlanningContext,rules:AvailabilityRule[],overrides:AvailabilityOverride[],tasks:PlanningTask[],plans:{id:string;day:string;rest:boolean;closed:boolean}[]):PlanningDay[] {
  return weekKeys(week).map(day=>{const plan=plans.find(plan=>plan.day===day),planStatus=plan?(plan.rest?"rest" as const:"active" as const):null,capacity=resolveCapacity(day,context,rules,overrides,planStatus);return {day,planId:plan?.id||null,...capacity,rest:plan?.rest||capacity.rest,capacity:plan?.rest?0:capacity.capacity,closed:plan?.closed||false,tasks:tasks.filter(task=>task.day===day).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id))}})
}
export function dayLoad(day:PlanningDay){return day.tasks.filter(consumesCapacity).reduce((sum,task)=>sum+task.minutes,0)}
export function capacityConflicts(days:PlanningDay[]){return days.filter(day=>dayLoad(day)>day.capacity).map(day=>({day:day.day,overBy:dayLoad(day)-day.capacity}))}
