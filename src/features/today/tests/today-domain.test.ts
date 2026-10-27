import { describe, expect, it } from "vitest"
import { assembleToday, unavailableContributions } from "../services/today-service"
import { rankTodayTasks, extractSignals, type RankingContext } from "../services/priority-engine"
import { dailyStatus } from "../services/daily-status-service"
import { dayKeyAt, focusByDay, weekKeys } from "../services/day-context"
import { todayCommandSchema } from "../schemas/today.schema"
import { todayKeys } from "../services/query-keys"
import { REASON_COPY } from "../services/recommendation-explainer"
import { loadTodayContributions } from "../services/domain-ports"
import type { TodayContext, TodayPlan, TodayTask } from "../types/today.types"

export const context:TodayContext={workspaceId:"w1",slug:"general",name:"General",timezone:"Asia/Kolkata",role:"Software engineer",company:null,targetDate:null,weeklyTargetMinutes:600,dailyMinutes:120,studyDays:["saturday"],hasCurriculum:true,contextVersion:"v1",canEdit:true}
export const now="2026-10-24T07:00:00.000Z"
export const plan:TodayPlan={id:"p1",workspaceId:"w1",dayKey:"2026-10-24",timezone:context.timezone,status:"active",plannedMinutes:90,contextVersion:"v1",createdAt:now}
export function task(overrides:Partial<TodayTask>={}):TodayTask{return {id:"t1",workspaceId:"w1",planId:"p1",dayKey:"2026-10-24",title:"Review SQL joins",notes:"Explain inner and left joins.",type:"fundamentals",source:"custom",sourceId:null,estimatedMinutes:30,required:true,status:"planned",dueAt:null,order:0,version:0,createdAt:now,startedAt:null,completedAt:null,...overrides}}
const ranking:RankingContext={workspaceId:"w1",dayKey:"2026-10-24",now,recentTypes:[],focusedByType:{},restDay:false,weeklyBehind:false}

describe("priority eligibility and explainability",()=>{
  it.each([{status:"completed"},{status:"skipped"},{status:"deferred"},{workspaceId:"w2"},{blocked:true},{dependencySatisfied:false},{dayKey:"2026-10-25"},{availableFrom:"2026-10-25"},{availableUntil:"2026-10-23"}] as Partial<TodayTask>[])("excludes invalid candidate %j",overrides=>{expect(rankTodayTasks([task(overrides)],ranking)).toEqual([])})
  it("critical interview deadline outranks a revision and penalties cannot suppress it",()=>{
    const interview=task({id:"interview",type:"interview",dueAt:"2026-10-25T06:00:00Z",evidence:{deadlineKind:"interview"}})
    const revision=task({id:"revision",type:"revision",source:"revision",sourceId:"r1",evidence:{revisionState:"today",weakness:1,targetAlignment:1}})
    const result=rankTodayTasks([revision,interview],{...ranking,recentTypes:["interview","interview","interview"],focusedByType:{interview:300}})
    expect(result[0].task.id).toBe("interview");expect(result[0].reasons).toContain("INTERVIEW_SOON")
  })
  it("required overdue revision wins against optional new work",()=>{
    const revision=task({id:"revision",source:"revision",sourceId:"r1",dueAt:"2026-10-23T06:00:00Z",evidence:{revisionState:"overdue",weakness:.8,targetAlignment:1,recentMistakes:true}})
    const result=rankTodayTasks([task({id:"optional",required:false}),revision],ranking)
    expect(result[0].task.id).toBe("revision")
    expect(result[0].reasons).toEqual(expect.arrayContaining(["OVERDUE","REVISION_DUE","WEAK_TOPIC","TARGET_CRITICAL","RECENT_MISTAKES"]))
    expect(result.every(item=>item.reasons.length&&item.reasons.every(reason=>REASON_COPY[reason].detail))).toBe(true)
  })
  it("caps stale overdue influence and invalid normalized input",()=>{
    const signals=extractSignals(task({dueAt:"2000-01-01T00:00:00Z",evidence:{weakness:900,targetAlignment:-10}}),ranking)
    expect(signals.overdue).toBe(1);expect(signals.weakness).toBe(1);expect(signals.alignment).toBe(0)
  })
  it("applies bounded diversity adjustments without penalizing intentional revision repetition",()=>{
    const result=rankTodayTasks([task({id:"arrays",type:"dsa"}),task({id:"dbms"})],{...ranking,recentTypes:["dsa","dsa","dsa"],focusedByType:{dsa:120}})
    expect(result[0].task.id).toBe("dbms")
    expect(extractSignals(task({source:"revision",type:"dsa"}),{...ranking,recentTypes:["dsa","dsa","dsa"]}).repetition).toBe(0)
  })
  it("uses stable IDs instead of database row order to break ties",()=>{
    const tasks=[task({id:"b"}),task({id:"a"})]
    expect(rankTodayTasks(tasks,ranking).map(r=>r.task.id)).toEqual(rankTodayTasks([...tasks].reverse(),ranking).map(r=>r.task.id))
    expect(rankTodayTasks(tasks,ranking)[0].task.id).toBe("a")
  })
  it("keeps optional work out of rest days",()=>{expect(rankTodayTasks([task({required:false})],{...ranking,restDay:true})).toEqual([])})
})

describe("daily status",()=>{
  const defaults={tasks:[task()],rest:false,capacityMinutes:120,focusedMinutes:null,plannedMinutes:90,now}
  it.each([
    ["On Track",{}],
    ["At Risk",{capacityMinutes:10}],
    ["Behind",{capacityMinutes:10,tasks:[task({dueAt:"2026-10-23T00:00:00Z"})]}],
    ["Complete",{tasks:[task({status:"completed"}),task({id:"optional",required:false})]}],
    ["Rest Day",{tasks:[],rest:true,focusedMinutes:0}],
    ["Ahead",{focusedMinutes:90}],
  ] as const)("derives %s with a reason",(status,changes)=>{const result=dailyStatus({...defaults,...(changes as unknown as Partial<typeof defaults>)});expect(result.status).toBe(status);expect(result.reason.length).toBeGreaterThan(10)})
  it("does not mistake a skipped requirement for completed work",()=>{expect(dailyStatus({...defaults,tasks:[task({status:"skipped"})]}).status).toBe("Behind")})
})

describe("workspace-local calendar and authoritative time",()=>{
  it("uses the workspace day across UTC midnight",()=>{expect(dayKeyAt("2026-10-24T19:00:00Z","Asia/Kolkata")).toBe("2026-10-25");expect(dayKeyAt("2026-10-24T02:00:00Z","America/New_York")).toBe("2026-10-23")})
  it("splits midnight-crossing focus and unions duplicate intervals",()=>{
    const segments=[{start:"2026-10-24T18:00:00Z",end:"2026-10-24T19:00:00Z"}]
    expect(focusByDay([...segments,...segments],"Asia/Kolkata",["2026-10-24","2026-10-25"])).toEqual({"2026-10-24":30,"2026-10-25":30})
  })
  it("handles the 25-hour DST day",()=>{expect(focusByDay([{start:"2026-11-01T04:00:00Z",end:"2026-11-02T05:00:00Z"}],"America/New_York",["2026-11-01"])["2026-11-01"]).toBe(1500)})
  it("handles the 23-hour DST day",()=>{expect(focusByDay([{start:"2026-03-08T05:00:00Z",end:"2026-03-09T04:00:00Z"}],"America/New_York",["2026-03-08"])["2026-03-08"]).toBe(1380)})
  it("uses Monday-to-Sunday week keys",()=>{expect(weekKeys("2026-10-25")).toEqual(["2026-10-19","2026-10-20","2026-10-21","2026-10-22","2026-10-23","2026-10-24","2026-10-25"])})
})

describe("Today projection",()=>{
  it("isolates a secondary source failure and preserves an available readiness summary",async()=>{
    const result=await loadTodayContributions({focus:async()=>{throw new Error("Source unavailable")},readiness:async()=>({state:"ready",summary:"Developing",detail:"Based on recorded evidence"})},{workspaceId:context.workspaceId,dayKey:plan.dayKey,timezone:context.timezone,now})
    expect(result.focus.state).toBe("error");expect(result.readiness.summary).toBe("Developing");expect(result.revision.dueCount).toBeNull()
  })
  it("does not equate completed estimates to recorded focus",()=>{const s=assembleToday({context,plan,tasks:[task({status:"completed"})],now});expect(s.focusedMinutes).toBeNull();expect(s.plannedMinutes).toBe(90);expect(s.state).toBe("complete");expect(s.readiness.summary).toBeNull()})
  it("fails closed for foreign workspace contributions",()=>{const contributions=unavailableContributions();contributions.upcoming.events=[{id:"event",workspaceId:"w2",title:"Private event",at:now,kind:"interview",importance:1}];expect(()=>assembleToday({context,plan,tasks:[],contributions,now})).toThrow("scope mismatch")})
  it.each([[false,null,"no_curriculum"],[true,null,"no_plan"],[true,{...plan,contextVersion:"old"},"stale"],[true,{...plan,status:"rest"},"rest"]] as const)("keeps deliberate empty/stale states",(hasCurriculum,inputPlan,state)=>{expect(assembleToday({context:{...context,hasCurriculum},plan:inputPlan,tasks:[],now}).state).toBe(state)})
  it("protects completed days from optional recommendations",()=>{const s=assembleToday({context,plan,tasks:[task({status:"completed"}),task({id:"optional",required:false})],now});expect(s.state).toBe("complete");expect(s.requiredCount).toBe(1)})
  it("query keys are workspace and day scoped under the existing switch-cache boundary",()=>{expect(todayKeys.snapshot("one","2026-10-24")).not.toEqual(todayKeys.snapshot("two","2026-10-24"));expect(todayKeys.snapshot("one","2026-10-24")).not.toEqual(todayKeys.snapshot("one","2026-10-25"));expect(todayKeys.snapshot("one","2026-10-24").slice(0,2)).toEqual(["workspaces","one"])})
  it("rejects invalid dates, unversioned writes and empty tasks",()=>{expect(todayCommandSchema.safeParse({kind:"complete",slug:"general",dayKey:"2026-10-24",taskId:crypto.randomUUID()}).success).toBe(false);expect(todayCommandSchema.safeParse({kind:"add",slug:"general",dayKey:"2026-02-30",title:""}).success).toBe(false)})
})
