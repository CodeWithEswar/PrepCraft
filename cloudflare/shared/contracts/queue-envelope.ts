import { z } from "zod"

/** A consumer supplies its literal event name and strict payload schema. */
export function createQueueEnvelopeSchema<const Event extends string, T extends z.ZodType>(eventType: Event, payload: T) {
  return z.strictObject({
    version: z.literal(1),
    type: z.literal(eventType),
    eventId: z.uuid(),
    occurredAt: z.iso.datetime({ offset: true }),
    workspaceId: z.uuid(),
    userId: z.uuid().optional(),
    correlationId: z.uuid(),
    idempotencyKey: z.string().min(1).max(128).regex(/^[a-zA-Z0-9:._-]+$/),
    payload,
  })
}
