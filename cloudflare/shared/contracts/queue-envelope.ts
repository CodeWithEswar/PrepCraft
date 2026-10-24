import { z } from "zod"

export const CURRENT_ENVELOPE_VERSION = 1 as const

export type QueueEnvelope<TPayload> = {
  version: typeof CURRENT_ENVELOPE_VERSION
  eventId: string
  type: string
  occurredAt: string
  workspaceId: string
  userId?: string
  correlationId: string
  idempotencyKey: string
  payload: TPayload
}

/** A consumer supplies its literal event name and strict payload schema. */
export function createQueueEnvelopeSchema<const Event extends string, T extends z.ZodType>(
  eventType: Event,
  payload: T
) {
  return z.strictObject({
    version: z.literal(CURRENT_ENVELOPE_VERSION),
    type: z.literal(eventType),
    eventId: z.string().uuid(),
    occurredAt: z.string().datetime({ offset: true }),
    workspaceId: z.string().uuid(),
    userId: z.string().uuid().optional(),
    correlationId: z.string().uuid(),
    idempotencyKey: z.string().min(1).max(128).regex(/^[a-zA-Z0-9:._-]+$/),
    payload,
  })
}
