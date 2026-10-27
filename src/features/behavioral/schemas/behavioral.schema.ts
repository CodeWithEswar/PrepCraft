import { z } from "zod"
const scope=z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/),identity=z.string().regex(/^[a-z0-9][a-z0-9-]{0,199}$/),uuid=z.uuid()
export const storyType=z.enum(["project","internship","academic","leadership","team","personal_project","open_source","volunteering","other"])
export const storyFormSchema=z.object({title:z.string().trim().min(1).max(160),summary:z.string().max(500),situation:z.string().max(6000),task:z.string().max(4000),action:z.string().max(10000),result:z.string().max(6000),reflection:z.string().max(4000),private_notes:z.string().max(4000),context:z.string().max(300),period:z.string().max(100),story_type:storyType.nullable(),status:z.enum(["draft","developing","practice_ready"])}).superRefine((s,ctx)=>{if(s.status==="practice_ready")for(const key of ["situation","task","action","result"] as const)if(!s[key].trim())ctx.addIssue({code:"custom",path:[key],message:"Add this section before marking the story practice ready."})})
export type StoryFormValues=z.infer<typeof storyFormSchema>
export const filtersSchema=z.object({search:z.string().max(120).default(""),status:z.enum(["active","all","draft","developing","practice_ready","retired"]).default("active"),principle:z.string().max(200).default(""),type:z.string().max(40).default(""),confidence:z.enum(["","1","2","3","4","5"]).default(""),practice:z.enum(["all","never","stale","recent"]).default("all"),beforeAt:z.iso.datetime().optional(),beforeId:uuid.optional()})
const mapping=z.object({principleId:identity,relevance:z.enum(["primary","strong","supporting"]),notes:z.string().max(1000).default("")})
const commands=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("create"),title:z.string().trim().min(1).max(160)}),z.object({kind:z.literal("edit"),storyId:uuid,version:z.number().int().nonnegative(),patch:storyFormSchema}),
 z.object({kind:z.literal("mapping"),storyId:uuid,version:z.number().int().nonnegative(),mappings:z.array(mapping).max(20)}),z.object({kind:z.enum(["retire","restore","duplicate"]),storyId:uuid,version:z.number().int().nonnegative()}),
 z.object({kind:z.literal("framework"),frameworkId:identity,frameworkVersion:z.number().int().positive()}),z.object({kind:z.literal("custom_framework"),name:z.string().trim().min(1).max(120),principles:z.array(z.string().trim().min(1).max(120)).min(1).max(30)})
])
export const commandSchema=z.object({slug:scope,requestId:uuid,command:commands})
export const launchSchema=z.object({slug:scope,storyId:uuid,promptId:identity.nullable(),target:z.number().int().min(60).max(900).nullable(),requestId:uuid})
export const ratingSchema=z.object({retold:z.boolean(),confidence:z.number().int().min(1).max(5),clarity:z.number().int().min(1).max(5),actionSpecificity:z.number().int().min(1).max(5),resultSpecificity:z.number().int().min(1).max(5),reflection:z.string().max(4000).default("")})
export const completeSchema=z.object({slug:scope,sessionId:uuid,requestId:uuid,evidence:ratingSchema})
export const selectionSchema=z.object({slug:scope,id:uuid})
