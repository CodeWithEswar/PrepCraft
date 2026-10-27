import type { RevisionOutcome } from "../types/revision.types"
import { dayKeyAt,shiftDay } from "@/lib/time/workspace-calendar-core"
export const REVISION_POLICY="revision-policy-v1"
export const INTERVALS=[1,3,7,14,30] as const
export const outcomeLabels:Record<RevisionOutcome,string>={independent_success:"Solved independently",minor_assistance:"Needed a small hint",major_assistance:"Needed major assistance",failed_recall:"Could not recall"}
export function mapAttemptOutcome(result:string):RevisionOutcome {
 switch(result){case "solved_independently":return "independent_success";case "solved_small_hint":return "minor_assistance";case "solved_major_hint":return "major_assistance";case "could_not_solve":return "failed_recall";default:throw new Error("Unsupported attempt outcome")}
}
export function nextInterval(previous:number|null,outcome:RevisionOutcome):number {
 if(previous===null)return 1
 const index=INTERVALS.indexOf(previous as typeof INTERVALS[number]);if(index<0)throw new Error("Unsupported interval")
 if(outcome==="independent_success")return INTERVALS[Math.min(index+1,4)]
 if(outcome==="minor_assistance")return previous
 if(outcome==="major_assistance")return INTERVALS[Math.max(0,index-1)]
 return 1
}
/** Calendar days, not elapsed 24-hour periods. SQL resolves 09:00 in the IANA zone. */
export function nextReviewDay(at:string,timezone:string,previous:number|null,outcome:RevisionOutcome){return shiftDay(dayKeyAt(at,timezone),nextInterval(previous,outcome))}
export function scheduleExplanation(reason:string):string {
 return ({EARLY_PRACTICE_NO_ADVANCE:"Practice before the recall date does not advance spaced repetition. A failed early practice may bring the review closer; it gives no Mastery credit.",LATE_EVIDENCE_NO_CHANGE:"Earlier evidence was recorded without replacing a newer schedule.",INITIAL_REVIEW:"A first review is scheduled after one calendar day.",INDEPENDENT_ADVANCE:"Independent recall moves the review one step along the interval ladder.",ASSISTED_HOLD:"A small hint keeps the current interval for another review.",ASSISTED_SHORTER:"Major assistance moves the review one step closer.",FAILED_RESET:"Failed recall returns the next review to one day.",MAINTENANCE_30:"Independent recall at the final step keeps a 30-day maintenance interval."} as Record<string,string>)[reason]||"See the recorded policy and review evidence."
}
