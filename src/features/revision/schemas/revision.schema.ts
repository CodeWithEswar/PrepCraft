import { z } from "zod"
const slug=z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/)
export const filtersSchema=z.object({search:z.string().trim().max(120).default(""),state:z.enum(["all","due","overdue","upcoming","retired"]).default("all"),outcome:z.enum(["all","independent_success","minor_assistance","major_assistance","failed_recall"]).default("all"),difficulty:z.enum(["all","easy","medium","hard","unspecified"]).default("all"),topic:z.string().max(120).default("")})
export const cursorSchema=z.object({asOf:z.iso.datetime({offset:true}),rank:z.coerce.number().min(-100).max(100),due:z.iso.datetime({offset:true}),id:z.uuid()}).nullable().default(null)
export const queueSchema=z.object({slug,filters:filtersSchema,cursor:cursorSchema})
export const revisionRequestSchema=z.object({slug,itemId:z.uuid(),version:z.number().int().nonnegative(),requestId:z.uuid(),command:z.discriminatedUnion("kind",[z.object({kind:z.enum(["start","retire","restore"])}),z.object({kind:z.literal("snooze"),until:z.iso.datetime({offset:true}),reason:z.string().trim().max(500)}),z.object({kind:z.literal("undo_snooze"),snoozeId:z.uuid()})])})
