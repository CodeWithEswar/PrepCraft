import { describe,it,expect } from "vitest"
import { emptyPlanning } from "../services/planning-service"
import { resolveCapacity,dayLoad } from "../services/capacity-service"
import { buildProposal } from "../services/plan-generation-service"
import { weeklyObservations,canCloseWeek } from "../services/weekly-review-service"
import { planningRequestSchema } from "../schemas/planning.schema"
import { scheduledWindow,weekKeys } from "@/lib/time/workspace-calendar"
import { planningKeys } from "../services/query-keys"
import type { PlanningContext,PlanningTask,PlanningSnapshot } from "../types/planning.types"
const context:PlanningContext={workspaceId:"workspace-one",slug:"one",name:"Software preparation",timezone:"UTC",today:"2026-10-19",company:null,role:"SDE",targetDate:null,canEdit:true,weeklyTargetMinutes:600,defaultDailyMinutes:120,studyDays:["monday","tuesday","wednesday","thursday","friday"],curriculumVersion:"v1",contextVersion:"context-one",hasCurriculum:true}
const snapshot=()=>emptyPlanning(context,"2026-10-19T09:00:00Z")
const task=(override:Partial<PlanningTask>={}):PlanningTask=>({id:"one",workspaceId:context.workspaceId,planId:"plan",day:"2026-10-19",title:"Arrays",notes:"",type:"dsa",source:"custom",sourceId:null,minutes:30,required:true,status:"planned",order:0,version:0,dueAt:null,scheduledStart:null,scheduledEnd:null,trackId:null,topicId:null,targetCount:null,targetUnit:null,carryoverFromId:null,carryoverCount:0,generationKey:null,...override})
function insert(s:PlanningSnapshot,t:PlanningTask){s.days.find(day=>day.day===t.day)!.tasks.push(t)}
describe("capacity precedence",()=>{
  it("respects workspace study days, not seven identical budgets",()=>{const s=snapshot();expect(s.days.map(day=>day.capacity)).toEqual([120,120,120,120,120,0,0])})
  it("uses a recurring rule before workspace defaults",()=>expect(resolveCapacity("2026-10-19",context,[{weekday:1,minutes:45,rest:false,start:null,end:null}],[]).capacity).toBe(45))
  it("uses a date exception before the recurring rule",()=>expect(resolveCapacity("2026-10-19",context,[{weekday:1,minutes:45,rest:false,start:null,end:null}],[{day:"2026-10-19",minutes:0,rest:true,start:null,end:null}])).toMatchObject({capacity:0,rest:true,capacitySource:"override"}))
  it("keeps unsupplied availability unset",()=>expect(resolveCapacity("2026-10-19",{studyDays:[],defaultDailyMinutes:0},[],[])).toMatchObject({capacity:0,capacitySource:"unset"}))
  it("separates estimates from completed status without erasing history",()=>{const s=snapshot();insert(s,task({status:"completed"}));insert(s,task({id:"two",status:"deferred"}));expect(dayLoad(s.days[0])).toBe(30)})
})
describe("deterministic allocation",()=>{
  it("returns the identical proposal for identical evidence",()=>{const s=snapshot();s.curriculum=[{id:"topic",trackId:"track",title:"Arrays",trackName:"DSA",priority:"core",type:"dsa",weight:5}];expect(buildProposal(s,"generate")).toEqual(buildProposal(s,"generate"))})
  it("never generates fake revision obligations or weak-area claims",()=>{const s=snapshot();s.goals=[{id:"g",title:"Reviews",kind:"revision_count",unit:"count",target:4,trackId:null,progress:null}];const p=buildProposal(s,"generate");expect(p.items).toHaveLength(0);expect(p.warnings.join(" ")).toMatch(/no revision tasks have been invented/);expect(p.warnings.join(" ")).toMatch(/without claiming weak areas/)})
  it("protects completed, active, scheduled, source, and deadline work",()=>{const s=snapshot();[task({id:"done",status:"completed"}),task({id:"active",status:"in_progress"}),task({id:"fixed",scheduledStart:"2026-10-19T09:00Z"}),task({id:"source",source:"revision",sourceId:"r"}),task({id:"due",dueAt:"2026-10-19T10:00Z"})].forEach(t=>insert(s,t));const p=buildProposal(s,"rebalance");expect(p.protectedIds).toEqual(["done","active","fixed","source","due"]);expect(p.items).toHaveLength(0)})
  it("leaves an atomic task unplaced when no whole slot fits",()=>{const s=snapshot();s.days.forEach(day=>day.capacity=20);insert(s,task({minutes:45}));const p=buildProposal(s,"rebalance");expect(p.unplaced).toHaveLength(1);expect(p.items).toHaveLength(0);expect(p.after[0].load).toBe(45)})
  it("never schedules on a rest day or into history",()=>{const s=snapshot();s.context={...s.context,today:"2026-10-22"};s.goals=[{id:"g",title:"Preparation",kind:"study_time",unit:"minutes",target:120,trackId:null,progress:null}];const p=buildProposal(s,"generate");expect(p.items.length).toBeGreaterThan(0);expect(p.items.every(item=>item.day>="2026-10-22"&&item.day<="2026-10-23")).toBe(true)})
  it("never silently removes optional work during rebalance",()=>{const s=snapshot();s.days.forEach(day=>day.capacity=0);insert(s,task({required:false}));expect(buildProposal(s,"rebalance").unplaced).toHaveLength(1)})
  it("uses real curriculum topics in priority order",()=>{const s=snapshot();s.days.forEach(day=>day.capacity=30);s.curriculum=[{id:"optional",trackId:"track",title:"Extra",trackName:"CS",priority:"optional",type:"fundamentals",weight:2},{id:"core",trackId:"track",title:"Indexes",trackName:"CS",priority:"core",type:"fundamentals",weight:2}];expect(buildProposal(s,"generate").items[0].topicId).toBe("core")})
  it("does not duplicate an already accepted generated key",()=>{const s=snapshot();s.curriculum=[{id:"topic",trackId:"track",title:"Arrays",trackName:"DSA",priority:"core",type:"dsa",weight:5}];const p=buildProposal(s,"generate");insert(s,task({generationKey:p.items[0].generationKey}));expect(buildProposal(s,"generate").items).toHaveLength(0)})
  it("bounds generated batches and leaves impossible goals explicit",()=>{const s=snapshot();s.goals=[{id:"g",title:"Questions",kind:"question_count",unit:"questions",target:100,trackId:null,progress:null}];const p=buildProposal(s,"generate");expect(p.unplaced.length).toBeGreaterThan(0);expect(p.items.length).toBeLessThanOrEqual(34)})
  it("includes context and planning revision in the proposal fingerprint",()=>{const s=snapshot();const a=buildProposal(s,"rebalance");s.revision++;expect(buildProposal(s,"rebalance").fingerprint).not.toBe(a.fingerprint)})
})
describe("review and calendar semantics",()=>{
  it("does not equate scheduled time with focused time",()=>{const s=snapshot();insert(s,task({status:"completed"}));expect(weeklyObservations(s).join(" ")).toMatch(/Focused time is unavailable/);expect(s.focusDays.every(day=>day.minutes===null)).toBe(true)})
  it("requires explicit unfinished required decisions before closing",()=>{const s=snapshot();s.context={...s.context,today:"2026-10-27"};insert(s,task());expect(canCloseWeek(s)).toBe(false);s.days[0].tasks[0].status="deferred";expect(canCloseWeek(s)).toBe(true)})
  it("keeps current weeks open until after the final local day",()=>expect(canCloseWeek(snapshot())).toBe(false))
  it("warns about repeated carryover",()=>{const s=snapshot();insert(s,task({carryoverCount:2}));expect(weeklyObservations(s).join(" ")).toMatch(/Repeated carryover/)})
  it("resolves unique local windows to UTC",()=>expect(scheduledWindow("2026-10-19","09:00","10:00","Asia/Kolkata")).toEqual({start:"2026-10-19T03:30:00.000Z",end:"2026-10-19T04:30:00.000Z"}))
  it("rejects spring daylight-saving gaps",()=>expect(()=>scheduledWindow("2026-03-08","02:15","03:30","America/New_York")).toThrow(/does not exist/))
  it("rejects ambiguous autumn daylight-saving folds",()=>expect(()=>scheduledWindow("2026-11-01","01:15","02:30","America/New_York")).toThrow(/repeats/))
  it("rejects backwards windows",()=>expect(()=>scheduledWindow("2026-10-19","10:00","09:00","UTC")).toThrow())
  it("uses Monday boundaries across year changes",()=>expect(weekKeys("2027-01-01")[0]).toBe("2026-12-28"))
  it("scopes caches to the workspace and week",()=>expect(planningKeys.week("a","2026-10-19")).not.toEqual(planningKeys.week("b","2026-10-19")))
  it("validates command windows and distinct weekday rules",()=>{const base={slug:"one",week:"2026-10-19",revision:0,requestId:"00000000-0000-4000-8000-000000000001"};expect(planningRequestSchema.safeParse({...base,command:{kind:"add",day:"2026-10-19",title:"Arrays",notes:"",type:"dsa",minutes:30,required:true,start:"10:00",end:"09:00"}}).success).toBe(false);const rule={weekday:1,minutes:30,rest:false,start:null,end:null};expect(planningRequestSchema.safeParse({...base,command:{kind:"availability",rules:[rule,rule]}}).success).toBe(false)})
})
