import { z } from "zod"
export const slugSchema=z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/)
export const cursorSchema=z.object({at:z.iso.datetime({offset:true}),id:z.uuid()}).nullable()
export const fileSchema=z.object({id:z.uuid(),workspaceId:z.uuid(),name:z.string(),originalName:z.string(),category:z.enum(["resume","attachment","export","report"]),mime:z.string(),bytes:z.number(),checksum:z.string(),status:z.enum(["PENDING_UPLOAD","READY","FAILED","DELETING","DELETED"]),version:z.number(),failureCode:z.string().nullable(),createdAt:z.string(),updatedAt:z.string()})
export const filesSchema=z.object({workspace:z.object({id:z.uuid(),slug:z.string(),name:z.string(),userId:z.uuid(),canEdit:z.boolean()}),items:z.array(fileSchema),cursor:cursorSchema})
export const fileCommandSchema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("upload"),name:z.string().trim().min(1).max(160).refine(s=>!/[\x00-\x1f\x7f/\\]/.test(s)),category:z.enum(["resume","attachment"]),mime:z.enum(["application/pdf","image/png","image/jpeg","text/plain"]),bytes:z.number().int().min(1).max(10485760),checksum:z.string().regex(/^[a-f0-9]{64}$/)}),
 z.object({kind:z.literal("download"),id:z.uuid()}),z.object({kind:z.literal("delete"),id:z.uuid(),version:z.number().int().nonnegative()})])
export type PrivateFile=z.infer<typeof fileSchema>
export type FileSnapshot=z.infer<typeof filesSchema>
