import { z } from "zod"
export const dateKey=z.iso.date()
const uuid=z.uuid(),minutes=z.number().int().min(5).max(480),time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const taskType=z.enum(["dsa","revision","aptitude","language","fundamentals","projects","behavioral","interview","timed_practice","custom"])
const title=z.string().trim().min(1).max(160),notes=z.string().max(1000),window={start:time.optional(),end:time.optional()}
const task={title,notes,type:taskType,minutes,required:z.boolean(),...window}
export const taskFormSchema=z.object(task)
const availability={minutes:z.number().int().min(0).max(720),rest:z.boolean(),start:time.nullable(),end:time.nullable()}
export const planningCommandSchema=z.discriminatedUnion("kind",[
  z.object({kind:z.literal("add"),day:dateKey,...task}),
  z.object({kind:z.literal("edit"),taskId:uuid,version:z.number().int().nonnegative(),...task}),
  z.object({kind:z.literal("move"),taskId:uuid,version:z.number().int().nonnegative(),day:dateKey}),
  z.object({kind:z.literal("carry"),taskId:uuid,version:z.number().int().nonnegative(),day:dateKey}),
  z.object({kind:z.literal("cancel"),taskId:uuid,version:z.number().int().nonnegative()}),
  z.object({kind:z.literal("reorder"),day:dateKey,taskIds:z.array(uuid).max(100)}),
  z.object({kind:z.literal("availability"),rules:z.array(z.object({weekday:z.number().int().min(0).max(6),...availability})).max(7),override:z.object({day:dateKey,...availability}).optional()}),
  z.object({kind:z.literal("goal"),goalId:uuid.optional(),title,goalKind:z.enum(["study_time","question_count","revision_count","topic_completion","practice_session","behavioral_story","custom"]),unit:z.enum(["minutes","count","sessions","topics","questions"]),target:z.number().int().min(1).max(10080),trackId:z.string().trim().min(1).max(120).nullable().optional()}),
  z.object({kind:z.literal("delete_goal"),goalId:uuid}),
  z.object({kind:z.literal("apply"),proposalKind:z.enum(["generate","rebalance"]),fingerprint:z.string().min(1).max(32)}),
  z.object({kind:z.literal("close"),notes:z.string().max(4000)})
]).superRefine((command,ctx)=>{
  if((command.kind==="add"||command.kind==="edit")&&((!!command.start!==!!command.end)||(command.start&&command.end&&command.end<=command.start)))ctx.addIssue({code:"custom",message:"Choose an end time after the start time.",path:["end"]})
  if(command.kind==="availability"){
    if(new Set(command.rules.map(rule=>rule.weekday)).size!==command.rules.length)ctx.addIssue({code:"custom",message:"Each weekday can have only one availability rule."})
    for(const rule of [...command.rules,...(command.override?[command.override]:[])])if((rule.rest&&rule.minutes!==0)||(!rule.rest&&rule.minutes<5)||(!!rule.start!==!!rule.end)||(rule.start&&rule.end&&(rule.end<=rule.start||Number(rule.end.slice(0,2))*60+Number(rule.end.slice(3))-Number(rule.start.slice(0,2))*60-Number(rule.start.slice(3))<rule.minutes)))ctx.addIssue({code:"custom",message:"Check the availability window and minutes."})
  }
  if(command.kind==="reorder"&&new Set(command.taskIds).size!==command.taskIds.length)ctx.addIssue({code:"custom",message:"Task order cannot contain duplicates."})
})
export const planningRequestSchema=z.object({slug:z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/),week:dateKey,revision:z.number().int().nonnegative(),requestId:uuid,command:planningCommandSchema})
