import { z } from "zod"

const contextSchema = z.object({
  correlationId: z.uuid().optional(),
  eventId: z.uuid().optional(),
  code: z.enum(["validation", "unauthenticated", "forbidden", "not_found", "conflict", "rate_limited", "unavailable", "unexpected"]).optional(),
  durationMs: z.number().finite().nonnegative().optional(),
  payloadBytes: z.number().int().nonnegative().max(100000000).optional(),
  pointCount: z.number().int().nonnegative().max(1000).optional(),
  view: z.enum(["overview","dsa","timing","consistency","interviews","topics"]).optional(),
})

// Allowlist fields: unknown context (tokens, body, email, error.stack) is dropped.
export function createLogRecord(level: "info" | "warn" | "error", event: string, context: unknown = {}) {
  const safeEvent = z.string().regex(/^[a-z][a-z0-9_.-]{0,79}$/).parse(event)
  const parsed = contextSchema.safeParse(context)
  return { timestamp: new Date().toISOString(), level, event: safeEvent, ...(parsed.success ? parsed.data : {}) }
}
