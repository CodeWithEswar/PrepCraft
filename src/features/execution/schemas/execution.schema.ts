import { z } from "zod"
const uuid=z.uuid(),slug=z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/),short=z.string().max(100),result=z.enum(["solved_independently","solved_small_hint","solved_major_hint","could_not_solve"]),mistake=z.enum(["recognition","logic","syntax","edge_case","complexity","forgotten_concept","communication","time_management"])
export const promptSchema=z.object({topicId:z.string().min(1).max(120).nullable().optional(),title:z.string().trim().min(1).max(160),body:z.string().max(12000),topic:z.string().max(120),difficulty:z.enum(["easy","medium","hard","unspecified"]),constraints:z.string().max(4000),examples:z.array(z.object({input:z.string().max(1000),output:z.string().max(1000),explanation:z.string().max(2000)})).max(6),hints:z.array(z.object({title:z.string().trim().min(1).max(80),body:z.string().trim().min(1).max(2000)})).max(3)})
export const launchSchema=z.object({slug,mode:z.enum(["practice","interview","oa"]),targetSeconds:z.number().int().min(60).max(14400).nullable(),source:z.enum(["manual","task"]),taskId:uuid.optional(),prompts:z.array(promptSchema).min(1).max(10),requestId:uuid}).superRefine((value,ctx)=>{
  if(value.mode!=="practice"&&value.targetSeconds===null)ctx.addIssue({code:"custom",message:"Choose a countdown duration."})
  if(value.mode==="interview"&&value.prompts.length!==1)ctx.addIssue({code:"custom",message:"Interview practice uses one question."})
  if(value.source==="task"&&!value.taskId)ctx.addIssue({code:"custom",message:"Choose an authorized planning task."})
})
export const debriefFields={attemptId:uuid,result:result.nullable(),approach:z.string().max(2000),patternId:z.string().min(1).max(120).nullable(),timeComplexity:short,spaceComplexity:short,confidence:z.number().int().min(1).max(5).nullable(),mistakes:z.array(mistake).max(8),notes:z.string().max(4000),completeLinkedTask:z.boolean().optional()}
export const debriefFormSchema=z.object(debriefFields)
export const commandSchema=z.discriminatedUnion("kind",[
 z.object({kind:z.enum(["pause","resume","finish","abandon","sync"])}),
 z.object({kind:z.literal("navigate"),itemId:uuid}),
 z.object({kind:z.literal("draft"),itemId:uuid,code:z.string().max(64000),language:z.enum(["typescript","javascript","java","python","cpp","text"]),scratchpad:z.string().max(12000),answer:z.string().max(12000)}),
 z.object({kind:z.literal("flag"),itemId:uuid,flagged:z.boolean()}),
 z.object({kind:z.literal("answer"),itemId:uuid,answered:z.boolean()}),
 z.object({kind:z.literal("hint"),itemId:uuid,level:z.number().int().min(1).max(3)}),
 z.object({kind:z.literal("phase"),phase:z.enum(["understand","clarify","approach","implement","test","review"])}),
 z.object({kind:z.literal("checklist"),items:z.array(z.enum(["assumptions","approach","complexity","edge_cases","tradeoffs"])).max(5)}),
 z.object({kind:z.enum(["debrief_draft","debrief"]),...debriefFields}),
]).superRefine((value,ctx)=>{if(value.kind==="debrief"&&(!value.result||value.confidence===null))ctx.addIssue({code:"custom",message:"Choose an outcome and confidence before saving the debrief."});if(value.kind==="debrief"&&new Set(value.mistakes).size!==value.mistakes.length)ctx.addIssue({code:"custom",message:"Choose each mistake category once."})})
export const executionRequestSchema=z.object({slug,sessionId:uuid,version:z.number().int().nonnegative(),requestId:uuid,command:commandSchema})
