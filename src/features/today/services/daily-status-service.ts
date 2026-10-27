import type { DailyStatus, TodayTask } from "../types/today.types"
export function dailyStatus({tasks,rest,capacityMinutes,focusedMinutes,plannedMinutes,now}:{tasks:readonly TodayTask[];rest:boolean;capacityMinutes:number;focusedMinutes:number|null;plannedMinutes:number;now:string}):{status:DailyStatus;reason:string} {
  const required=tasks.filter(t=>t.required&&!["deferred","cancelled"].includes(t.status))
  const pending=required.filter(t=>t.status!=="completed")
  const remaining=pending.reduce((sum,t)=>sum+t.estimatedMinutes,0)
  const overdue=pending.some(t=>t.dueAt&&Date.parse(t.dueAt)<Date.parse(now))
  const skipped=pending.some(t=>t.status==="skipped")
  if(rest)return {status:"Rest Day",reason:"An intentional rest day. No required preparation is scheduled."}
  if(required.length>0&&!pending.length)return {status:"Complete",reason:"All required tasks are complete. Optional work can wait."}
  if(skipped||(overdue&&remaining>capacityMinutes))return {status:"Behind",reason:skipped?"A required task was skipped. Review the plan to make the remaining commitment realistic.":"Overdue work exceeds the remaining time budget. Reschedule a task to recover the day."}
  if(overdue||remaining>capacityMinutes)return {status:"At Risk",reason:overdue?"A required deadline has passed. Give it attention or reschedule deliberately.":`${remaining} minutes of required work remain, above your ${capacityMinutes}-minute available budget.`}
  if(focusedMinutes!==null&&plannedMinutes>0&&focusedMinutes>=plannedMinutes&&pending.length>0)return {status:"Ahead",reason:"Your time commitment is met, and the remaining required tasks fit the available budget."}
  return {status:"On Track",reason:pending.length?"The remaining required work fits your available daily time budget.":"Only optional preparation is scheduled. Choose what is useful today."}
}
