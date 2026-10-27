import { dayLoad, consumesCapacity } from "./capacity-service"
import type { PlanningSnapshot, PlanningProposal, ProposedTask, CurriculumWork } from "../types/planning.types"

export const PLANNING_POLICY="capacity-v1"
const priority={core:0,high:1,medium:2,low:3,optional:4}
/** Stable non-security fingerprint; authorization and optimistic versions are checked by SQL. */
function fingerprint(value:unknown){let hash=2166136261;for(const character of JSON.stringify(value)){hash^=character.charCodeAt(0);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(16)}
function goalWork(snapshot:PlanningSnapshot):ProposedTask[] {
  const topics=[...snapshot.curriculum].sort((a,b)=>Number(b.priority==="core"&&(b.weakness||0)>=.5)-Number(a.priority==="core"&&(a.weakness||0)>=.5)||priority[a.priority]-priority[b.priority]||b.weight-a.weight||a.id.localeCompare(b.id)),seen=new Set(snapshot.days.flatMap(day=>day.tasks).filter(task=>task.status!=="cancelled").map(task=>task.generationKey))
  const work:ProposedTask[]=[]
  const add=(topic:CurriculumWork|undefined,title:string,minutes:number,key:string,required:boolean,count:number|null=null,unit:ProposedTask["targetUnit"]=null,type:ProposedTask["type"]="custom")=>{
    if(!seen.has(key))work.push({key,existingId:null,day:"",title,notes:"Planning estimate. Completion does not record question attempts, mastery, or focused time.",type:topic?.type||type,minutes,required,trackId:topic?.trackId||null,topicId:topic?.id||null,targetCount:count,targetUnit:unit,generationKey:key,reason:topic?`${topic.priority} curriculum · ${topic.trackName}`:"Weekly goal · user-defined intent"})
  }
  for(const goal of snapshot.goals){
    if(goal.kind==="revision_count")continue // Only authoritative revision obligations can create revision tasks.
    const pool=goal.trackId?topics.filter(topic=>topic.trackId===goal.trackId):topics
    if(goal.kind==="study_time"){
      let remaining=goal.target,index=0
      while(remaining>=5&&index<90){const minutes=remaining>60&&remaining-60<5?remaining-5:Math.min(60,remaining),topic=pool.length?pool[index%pool.length]:undefined;add(topic,topic?`Study ${topic.title}`:goal.title,minutes,`${snapshot.week}:${goal.id}:${index}`,true);remaining-=minutes;index++}
    }else{
      const count=Math.min(goal.target,100),batch=goal.kind==="question_count"?Math.min(3,count):1
      for(let index=0;index<count;index+=batch){const quantity=Math.min(batch,count-index),topic=pool.length?pool[Math.floor(index/batch)%pool.length]:undefined
        add(topic,`${goal.title}${topic?` · ${topic.title}`:""}`,goal.kind==="question_count"?quantity*15:30,`${snapshot.week}:${goal.id}:${index}`,true,quantity,goal.unit,goal.kind==="behavioral_story"?"behavioral":goal.kind==="practice_session"?"timed_practice":"custom")}
    }
  }
  if(!snapshot.goals.length){
    const remaining=snapshot.days.filter(day=>day.day>=snapshot.context.today&&!day.closed).reduce((sum,day)=>sum+Math.max(0,day.capacity-dayLoad(day)),0)
    topics.slice(0,Math.min(28,Math.floor(remaining/30))).forEach(topic=>add(topic,`Study ${topic.title}`,30,`${snapshot.week}:topic:${topic.id}`,topic.priority!=="optional"))
  }
  return work
}
/** Pure deterministic allocation. Existing obligations are protected; impossible work stays visible. */
export function buildProposal(snapshot:PlanningSnapshot,kind:"generate"|"rebalance"):PlanningProposal {
  if(snapshot.days.some(day=>day.tasks.some(task=>task.workspaceId!==snapshot.context.workspaceId||task.day!==day.day))||snapshot.carryover.some(task=>task.workspaceId!==snapshot.context.workspaceId))throw new Error("Planning input scope mismatch")
  const before=snapshot.days.map(day=>({day:day.day,load:dayLoad(day),capacity:day.capacity})),loads=new Map(before.map(day=>[day.day,day.load]))
  const protectedIds:string[]=[],items:ProposedTask[]=[],unplaced:PlanningProposal["unplaced"]=[],warnings:string[]=[]
  const eligible=snapshot.days.filter(day=>day.day>=snapshot.context.today&&!day.closed&&!day.rest)
  const work:ProposedTask[]=[]
  if(kind==="rebalance")for(const day of snapshot.days)for(const task of day.tasks.filter(consumesCapacity)){
    if(task.status!=="planned"||day.day<snapshot.context.today||day.closed||task.scheduledStart||task.source!=="custom"||task.dueAt){protectedIds.push(task.id);continue}
    loads.set(day.day,loads.get(day.day)!-task.minutes)
    work.push({key:task.id,existingId:task.id,day:day.day,title:task.title,notes:task.notes,type:task.type,minutes:task.minutes,required:task.required,trackId:task.trackId,topicId:task.topicId,targetCount:task.targetCount,targetUnit:task.targetUnit,generationKey:task.generationKey,reason:task.required?"Required unfinished work · available capacity":"Optional work · available capacity"})
  }
  else {protectedIds.push(...snapshot.days.flatMap(day=>day.tasks).map(task=>task.id));work.push(...goalWork(snapshot))}
  // Stable sort preserves the curriculum priority/weight order within each required tier.
  work.sort((a,b)=>Number(b.required)-Number(a.required))
  for(const task of work){
    const fitting=eligible.filter(day=>day.capacity-(loads.get(day.day)||0)>=task.minutes).sort((a,b)=>(loads.get(a.day)!/Math.max(a.capacity,1))-(loads.get(b.day)!/Math.max(b.capacity,1))||a.day.localeCompare(b.day))
    const destination=fitting[0]
    if(!destination){
      unplaced.push({title:task.title,minutes:task.minutes,reason:"No day has enough remaining capacity for this whole task. Change availability, duration, or priority."})
      if(task.existingId)loads.set(task.day,loads.get(task.day)!+task.minutes)
      continue
    }
    loads.set(destination.day,loads.get(destination.day)!+task.minutes)
    if(!task.existingId||task.day!==destination.day)items.push({...task,day:destination.day})
  }
  if(snapshot.evidence.revision!=="ready")warnings.push("Revision obligations are unavailable; no revision tasks have been invented.")
  if(snapshot.evidence.mastery!=="ready")warnings.push("Mastery evidence is unavailable. Curriculum priority is used without claiming weak areas.")
  if(snapshot.goals.some(goal=>goal.kind==="revision_count"))warnings.push("Revision goals need the Revision source before they can be allocated.")
  for(const goal of snapshot.goals){
    if(goal.kind!=="study_time"&&goal.kind!=="revision_count"&&goal.target>100)unplaced.push({title:goal.title,minutes:0,reason:"This goal exceeds the 100-unit proposal limit. Reduce it or divide the goal into achievable weeks."})
    if(goal.kind==="study_time"&&goal.target>5400)unplaced.push({title:goal.title,minutes:goal.target-5400,reason:"This goal exceeds the bounded proposal size and available weekly capacity."})
    if(goal.kind==="study_time"&&goal.target<5)unplaced.push({title:goal.title,minutes:goal.target,reason:"A preparation task needs at least five minutes. Increase this goal or combine it with another session."})
  }
  if(items.length>100)unplaced.push({title:"Proposal size limit",minutes:0,reason:"More than 100 task changes are proposed. Reduce the goals or apply a smaller plan."})
  if(!snapshot.context.hasCurriculum&&kind==="generate")warnings.push("Choose a curriculum to generate topic-based preparation work.")
  const after=before.map(day=>({...day,load:loads.get(day.day)!}))
  const base={kind,policy:PLANNING_POLICY,baseRevision:snapshot.revision,contextVersion:snapshot.context.contextVersion,week:snapshot.week,items,unplaced,protectedIds,warnings,before,after}
  return {...base,fingerprint:fingerprint(base)}
}
