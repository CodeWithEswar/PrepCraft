import { describe, it, expect } from "vitest"
import { z } from "zod"
import { createQueueEnvelopeSchema } from "@/../cloudflare/shared/contracts/queue-envelope"

describe("Integration: Cross-Boundary Queue Envelope Contracts", () => {
  const attemptPayloadSchema = z.strictObject({
    attemptId: z.string().uuid(),
    questionId: z.string().min(1),
    status: z.enum(["solved", "attempted", "failed"]),
    durationMs: z.number().int().positive(),
  })

  const attemptEnvelopeSchema = createQueueEnvelopeSchema(
    "question.attempt.completed",
    attemptPayloadSchema
  )

  const validUuid = "123e4567-e89b-12d3-a456-426614174000"
  const workspaceUuid = "223e4567-e89b-12d3-a456-426614174001"
  const correlationUuid = "323e4567-e89b-12d3-a456-426614174002"

  it("validates a properly formatted attempt event envelope", () => {
    const validMessage = {
      version: 1 as const,
      type: "question.attempt.completed" as const,
      eventId: validUuid,
      workspaceId: workspaceUuid,
      correlationId: correlationUuid,
      occurredAt: "2026-10-24T12:00:00.000Z",
      idempotencyKey: `attempt:${validUuid}`,
      payload: {
        attemptId: validUuid,
        questionId: "two-sum",
        status: "solved" as const,
        durationMs: 45000,
      },
    }

    const parsed = attemptEnvelopeSchema.parse(validMessage)
    expect(parsed.version).toBe(1)
    expect(parsed.type).toBe("question.attempt.completed")
    expect(parsed.payload.questionId).toBe("two-sum")
  })

  it("rejects corrupted envelopes missing required metadata or invalid payloads", () => {
    const invalidVersion = {
      version: 2,
      type: "question.attempt.completed",
      eventId: validUuid,
      workspaceId: workspaceUuid,
      correlationId: correlationUuid,
      occurredAt: "2026-10-24T12:00:00.000Z",
      idempotencyKey: "key-1",
      payload: {
        attemptId: validUuid,
        questionId: "two-sum",
        status: "solved",
        durationMs: 45000,
      },
    }

    expect(() => attemptEnvelopeSchema.parse(invalidVersion)).toThrow()

    const missingPayloadField = {
      version: 1,
      type: "question.attempt.completed",
      eventId: validUuid,
      workspaceId: workspaceUuid,
      correlationId: correlationUuid,
      occurredAt: "2026-10-24T12:00:00.000Z",
      idempotencyKey: "key-1",
      payload: {
        attemptId: validUuid,
        // missing questionId
        status: "solved",
        durationMs: 45000,
      },
    }

    expect(() => attemptEnvelopeSchema.parse(missingPayloadField)).toThrow()
  })
})
