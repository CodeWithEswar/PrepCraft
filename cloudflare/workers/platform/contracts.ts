import { z } from "zod"
const uuid=z.uuid()
export const jobSchema=z.object({version:z.literal(1),type:z.literal("platform.job"),eventId:uuid,occurredAt:z.iso.datetime({offset:true}),workspaceId:uuid,userId:uuid,correlationId:uuid,causationId:uuid.nullable(),payload:z.object({id:uuid,kind:z.enum(["file.delete","attempt.observe"])})}).strict()
export type PlatformJob=z.infer<typeof jobSchema>
export const outboxSchema=z.array(z.object({id:uuid,eventId:uuid,workspaceId:uuid,userId:uuid,correlationId:uuid,causationId:uuid.nullable(),kind:z.enum(["file.delete","attempt.observe"]),occurredAt:z.string(),leaseToken:uuid})).max(25)
export const claimSchema=z.discriminatedUnion("state",[
 z.object({state:z.enum(["denied","busy","done"])}),
 z.object({state:z.literal("claimed"),operationId:uuid,leaseToken:uuid,file:z.object({id:uuid,bucket:z.string(),key:z.string().min(1).max(1024),name:z.string().max(160),mime:z.enum(["application/pdf","image/png","image/jpeg","text/plain"]),bytes:z.number().int().min(1).max(10485760),checksum:z.string().regex(/^[a-f0-9]{64}$/)})})])
