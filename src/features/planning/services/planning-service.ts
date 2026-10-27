import { shiftDay, weekKeys } from "@/lib/time/workspace-calendar"
import type { PlanningContext, PlanningSnapshot } from "../types/planning.types"
import { buildDays } from "./capacity-service"
import { weeklyObservations } from "./weekly-review-service"

export function emptyPlanning(context:PlanningContext,now:string,week=weekKeys(context.today)[0]):PlanningSnapshot {
  const snapshot:PlanningSnapshot={context,week,revision:0,days:buildDays(week,context,[],[],[],[]),rules:[],overrides:[],goals:[],carryover:[],curriculum:[],review:null,observations:[],upcoming:context.targetDate?[{id:"target",title:"Target date",day:context.targetDate,kind:"milestone"}]:[],evidence:{revision:"unavailable",mastery:"unavailable",focus:"unavailable",interviews:"unavailable"},focusDays:Array.from({length:56},(_,index)=>({day:shiftDay(context.today,index-55),minutes:null})),generatedAt:now}
  snapshot.observations=weeklyObservations(snapshot)
  return snapshot
}
