import { z } from "zod"
export const subjectSchema=z.enum(["aptitude","java","sql-dbms","operating-systems","networks"])
export const identitySchema=z.string().regex(/^[a-z0-9][a-z0-9-]{0,199}$/)
export const scopeSchema=z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/)
export const catalogSchema=z.object({slug:scopeSchema,subject:subjectSchema.default("aptitude"),topic:identitySchema.nullable().default(null),search:z.string().trim().max(120).default(""),after:z.string().max(200).default(""),bookmarked:z.boolean().default(false)})
export const stateSchema=z.object({slug:scopeSchema,id:identitySchema,version:z.number().int().min(-1),requestId:z.uuid(),patch:z.object({note:z.string().max(4000).optional(),bookmarked:z.boolean().optional(),opened:z.literal(true).optional()}).strict()})
export const launchSchema=z.object({slug:scopeSchema,activity:identitySchema,mode:z.enum(["practice","timed"]),requestId:z.uuid()})
export const answerSchema=z.union([z.string().max(4000),z.number().finite(),z.array(z.string().max(300)).max(20)])
export const submitSchema=z.object({slug:scopeSchema,sessionId:z.uuid(),version:z.number().int().nonnegative(),answer:answerSchema,confidence:z.number().int().min(1).max(5),mistakes:z.array(z.enum(["recognition","logic","syntax","edge_case","complexity","forgotten_concept","communication","time_management"])).max(3).default([])})
