import type { RankedTask, ReasonCode, TodayTask } from "../types/today.types"

export const TODAY_PRIORITY_POLICY=Object.freeze({version:"today-priority-v1",weights:{urgency:22,revision:24,weakness:14,alignment:16,overdue:18},maxPenalty:12,fatigueMinutes:120,overdueDaysCap:7})
const clamp=(value:number)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0))
export interface RankingContext {workspaceId:string;dayKey:string;now:string;recentTypes:TodayTask["type"][];focusedByType:Partial<Record<TodayTask["type"],number>>;restDay:boolean;weeklyBehind:boolean}
export function eligible(task:TodayTask,context:RankingContext):boolean {
  const revisionDue=task.source==="revision"&&["today","overdue"].includes(task.evidence?.revisionState||"")
  return task.workspaceId===context.workspaceId&&["planned","in_progress"].includes(task.status)&&!task.blocked&&task.dependencySatisfied!==false&&(!task.availableFrom||task.availableFrom<=context.dayKey)&&(!task.availableUntil||task.availableUntil>=context.dayKey)&&(task.dayKey<=context.dayKey||revisionDue)&&(!context.restDay||task.criticality==="critical")
}
export function extractSignals(task:TodayTask,context:RankingContext) {
  const until=task.dueAt?(Date.parse(task.dueAt)-Date.parse(context.now))/86400000:null
  const overdue=until!==null&&until<0
  const fatigue=clamp((context.focusedByType[task.type]||0)/TODAY_PRIORITY_POLICY.fatigueMinutes)
  const repetition=task.source==="revision"?0:clamp(context.recentTypes.slice(-3).filter(type=>type===task.type).length/3)
  return {urgency:until===null?0:clamp((7-until)/7),revision:task.evidence?.revisionState==="overdue"?1:task.evidence?.revisionState==="today"?.8:task.evidence?.revisionState==="soon"?.2:0,weakness:clamp(task.evidence?.weakness||0),alignment:clamp(task.evidence?.targetAlignment||0),overdue:overdue?clamp(-until/TODAY_PRIORITY_POLICY.overdueDaysCap):0,fatigue,repetition,until}
}
export function rankTodayTasks(tasks:TodayTask[],context:RankingContext):RankedTask[] {
  const weights=TODAY_PRIORITY_POLICY.weights
  const ranked=tasks.filter(task=>eligible(task,context)).map(task=>{
    const signals=extractSignals(task,context)
    const reasons:ReasonCode[]=[]
    if(task.status==="in_progress")reasons.push("IN_PROGRESS")
    if(signals.until!==null&&signals.until<0)reasons.push("OVERDUE")
    if(signals.revision>=.8)reasons.push("REVISION_DUE")
    if(task.evidence?.deadlineKind&&signals.until!==null&&signals.until<=7)reasons.push(task.evidence.deadlineKind==="interview"?"INTERVIEW_SOON":"OA_SOON")
    if(signals.weakness>=.5)reasons.push("WEAK_TOPIC")
    if(task.evidence?.recentMistakes)reasons.push("RECENT_MISTAKES")
    if(signals.alignment>=.75)reasons.push("TARGET_CRITICAL")
    if(context.weeklyBehind&&task.required&&task.dayKey===context.dayKey)reasons.push("WEEKLY_TARGET_BEHIND")
    if(task.dayKey===context.dayKey)reasons.push("SCHEDULED_TODAY")
    if(!reasons.length)reasons.push(task.required?"SCHEDULED_TODAY":"OPTIONAL")
    const penalty=Math.min(TODAY_PRIORITY_POLICY.maxPenalty,signals.fatigue*8+signals.repetition*6)
    const score=Object.entries(weights).reduce((sum,[key,weight])=>sum+signals[key as keyof typeof weights]*weight,0)-penalty
    const deadlineCritical=signals.until!==null&&signals.until<=1&&task.required&&(task.evidence?.deadlineKind!==undefined||task.evidence?.revisionState==="overdue")
    const tier=task.criticality==="critical"||deadlineCritical?0:task.required?1:task.criticality==="recommended"?2:3
    return {task,rank:0,score,reasons,policyVersion:TODAY_PRIORITY_POLICY.version,tier,deadline:task.dueAt?Date.parse(task.dueAt):Infinity,penalties:[...(signals.fatigue>=.5?["Recent focus time in this area reduced its scheduling weight."]:[]),...(signals.repetition>=.6?["Recent tasks were concentrated in this area; variety was considered."]:[])]}
  })
  ranked.sort((a,b)=>a.tier-b.tier||((a.tier===0&&b.tier===0)?a.deadline-b.deadline:0)||Number(b.task.status==="in_progress")-Number(a.task.status==="in_progress")||b.score-a.score||a.deadline-b.deadline||a.task.order-b.task.order||a.task.createdAt.localeCompare(b.task.createdAt)||a.task.id.localeCompare(b.task.id))
  return ranked.map((entry,index)=>({task:entry.task,rank:index+1,score:entry.score,reasons:entry.reasons,policyVersion:entry.policyVersion,penalties:entry.penalties}))
}
