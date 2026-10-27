import type { RevisionItem } from "../types/revision.types"
import { dayKeyAt,daysBetween } from "@/lib/time/workspace-calendar-core"
export type RevisionReason="OVERDUE"|"DUE_TODAY"|"ASSISTED_LAST_REVIEW"|"FAILED_LAST_REVIEW"|"REPEATED_FAILURE"|"SNOOZED_PREVIOUSLY"
export function recallScore(item:RevisionItem,now:string){const overdue=Math.max(0,(Date.parse(now)-Date.parse(item.due_at))/86400000);return Math.min(1,overdue/14)*40+({independent_success:0,minor_assistance:12,major_assistance:22,failed_recall:30}[item.last_outcome])+Math.min(item.failure_count,3)*4+Math.min(item.snooze_count,3)*2}
export function recallPressure(item:RevisionItem,now:string):"High"|"Medium"|"Low" {const score=recallScore(item,now);return score>=30?"High":score>=12?"Medium":"Low"}
export function revisionReasons(item:RevisionItem,now:string,timezone:string):{code:RevisionReason;label:string}[]{
 const late=daysBetween(dayKeyAt(item.due_at,timezone),dayKeyAt(now,timezone)),reasons:{code:RevisionReason;label:string}[]=[]
 if(late>0)reasons.push({code:"OVERDUE",label:`Overdue by ${late} day${late===1?"":"s"}`});else if(Date.parse(item.due_at)<=Date.parse(now))reasons.push({code:"DUE_TODAY",label:"Due today"})
 if(item.last_outcome==="failed_recall")reasons.push({code:"FAILED_LAST_REVIEW",label:"Last review needed reinforcement"})
 else if(item.last_outcome!=="independent_success")reasons.push({code:"ASSISTED_LAST_REVIEW",label:item.last_outcome==="minor_assistance"?"Last review needed a small hint":"Last review needed major assistance"})
 if(item.failure_count>=2)reasons.push({code:"REPEATED_FAILURE",label:`${item.failure_count} recorded recall difficulties`})
 if(item.snooze_count)reasons.push({code:"SNOOZED_PREVIOUSLY",label:`Previously snoozed ${item.snooze_count} time${item.snooze_count===1?"":"s"}`})
 return reasons
}
export function rankRevisions(items:RevisionItem[],now:string){return items.filter(item=>["scheduled","snoozed"].includes(item.state)&&Date.parse(item.due_at)<=Date.parse(now)).toSorted((a,b)=>recallScore(b,now)-recallScore(a,now)||a.due_at.localeCompare(b.due_at)||a.id.localeCompare(b.id))}
export function retentionBand(item:RevisionItem){return ["failed_recall","major_assistance"].includes(item.last_outcome)?"Needs reinforcement":item.independent_streak>=4?"Strong retention":item.independent_streak>=2?"Stable recall":"Developing"}
