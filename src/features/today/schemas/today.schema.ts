import { z } from "zod"
export const taskTypes=["dsa","revision","aptitude","language","fundamentals","projects","behavioral","interview","timed_practice","custom"] as const
export const daySchema=z.iso.date()
export const todayCommandSchema=z.object({kind:z.enum(["add","create_plan","rest","study","review","start","complete","skip","defer"]),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/),dayKey:daySchema,taskId:z.uuid().optional(),version:z.number().int().min(0).optional(),title:z.string().trim().min(1).max(160).optional(),notes:z.string().trim().max(1000).optional(),type:z.enum(taskTypes).optional(),minutes:z.number().int().min(5).max(480).optional(),required:z.boolean().optional(),destination:daySchema.optional()}).superRefine((value,ctx)=>{
  if(value.kind==="add"&&(!value.title||!value.type||!value.minutes||!value.taskId))ctx.addIssue({code:"custom",message:"Add a title, category and estimate for this task."})
  if(["start","complete","skip","defer"].includes(value.kind)&&(!value.taskId||value.version===undefined))ctx.addIssue({code:"custom",message:"The task is missing its current version. Refresh and try again."})
  if(value.kind==="defer"&&(!value.destination||value.destination<value.dayKey))ctx.addIssue({code:"custom",message:"Choose today or a future date."})
})
