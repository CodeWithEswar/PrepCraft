import { describe, it, expect, vi } from "vitest"
import { z } from "zod"
import { validatePayload, classifyError } from "../shared/validation/payload-validator"
import { verifyServiceToken, extractJwtClaims } from "../shared/auth/worker-auth"
import { sanitizeLogData, createWorkerLogger } from "../shared/observability/structured-logger"
import { createQueueEnvelopeSchema } from "../shared/contracts/queue-envelope"

describe("Cloudflare Shared Infrastructure", () => {
  describe("Payload Validation & Error Classification", () => {
    const testSchema = z.strictObject({
      action: z.string(),
      count: z.number().int().positive(),
    })

    it("successfully validates conforming payload", () => {
      const valid = { action: "sync", count: 5 }
      const res = validatePayload(testSchema, valid)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.action).toBe("sync")
        expect(res.data.count).toBe(5)
      }
    })

    it("returns classified TERMINAL error when payload fails schema validation", () => {
      const invalid = { action: "sync", count: -1 }
      const res = validatePayload(testSchema, invalid)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.classification).toBe("TERMINAL")
        expect(res.error.message).toContain("Payload validation failed")
      }
    })

    it("classifies transient errors as RETRYABLE and permanent errors as TERMINAL", () => {
      const timeoutError = new Error("Connection timeout to Supabase")
      expect(classifyError(timeoutError).classification).toBe("RETRYABLE")

      const rateLimitError = new Error("Rate limit exceeded: 429 Too Many Requests")
      expect(classifyError(rateLimitError).classification).toBe("RETRYABLE")

      const authError = new Error("Unauthorized: Invalid bearer credentials")
      expect(classifyError(authError).classification).toBe("TERMINAL")

      const schemaError = new z.ZodError([])
      expect(classifyError(schemaError).classification).toBe("TERMINAL")
    })
  })

  describe("Worker Service Authentication", () => {
    const secret = "test-super-secret-key-12345"

    it("accepts valid bearer authorization header matching secret", async () => {
      const res = await verifyServiceToken(`Bearer ${secret}`, secret, "analytics-worker")
      expect(res.authenticated).toBe(true)
      if (res.authenticated) {
        expect(res.serviceName).toBe("analytics-worker")
      }
    })

    it("rejects mismatched secret, malformed header, or missing token", async () => {
      const wrong = await verifyServiceToken("Bearer wrong-secret", secret)
      expect(wrong.authenticated).toBe(false)

      const malformed = await verifyServiceToken("Basic token", secret)
      expect(malformed.authenticated).toBe(false)

      const missing = await verifyServiceToken(null, secret)
      expect(missing.authenticated).toBe(false)
    })

    it("extracts claims from valid JWT payload without signature verification", () => {
      // payload: {"sub":"usr-123","role":"authenticated","exp":1792830000}
      const payloadBase64 = btoa(JSON.stringify({ sub: "usr-123", role: "authenticated", exp: 1792830000 }))
      const fakeJwt = `header.${payloadBase64}.signature`

      const claims = extractJwtClaims(fakeJwt)
      expect(claims).not.toBeNull()
      expect(claims?.userId).toBe("usr-123")
      expect(claims?.role).toBe("authenticated")
      expect(claims?.expiresAt).toBe(1792830000)

      expect(extractJwtClaims("not-a-jwt")).toBeNull()
    })
  })

  describe("Structured Observability & Log Sanitization", () => {
    it("redacts sensitive fields while preserving operational context", () => {
      const rawLog = {
        worker: "reminder-dispatcher",
        operation: "dispatchReminders",
        durationMs: 42,
        authorization: "Bearer secret-token-xyz",
        apiKey: "pk_live_123",
        nested: {
          userPassword: "plain-password",
          workspaceId: "ws_456",
        },
      }

      const sanitized = sanitizeLogData(rawLog) as Record<string, unknown>
      expect(sanitized.worker).toBe("reminder-dispatcher")
      expect(sanitized.operation).toBe("dispatchReminders")
      expect(sanitized.durationMs).toBe(42)
      expect(sanitized.authorization).toBe("[REDACTED]")
      expect(sanitized.apiKey).toBe("[REDACTED]")

      const nested = sanitized.nested as Record<string, unknown>
      expect(nested.workspaceId).toBe("ws_456")
      expect(nested.userPassword).toBe("[REDACTED]")
    })

    it("WorkerLogger emits formatted log messages", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const logger = createWorkerLogger({ worker: "test-worker", operation: "test" })

      logger.info("Task completed successfully", { durationMs: 15, outcome: "success" })
      expect(logSpy).toHaveBeenCalled()

      const output = JSON.parse(logSpy.mock.calls[0][0])
      expect(output.worker).toBe("test-worker")
      expect(output.operation).toBe("test")
      expect(output.message).toBe("Task completed successfully")
      expect(output.durationMs).toBe(15)
      expect(output.outcome).toBe("success")

      logSpy.mockRestore()
    })
  })

  describe("Queue Envelope Integration", () => {
    const payloadSchema = z.strictObject({
      reminderId: z.string(),
      dueAt: z.string().datetime(),
    })
    const envelopeSchema = createQueueEnvelopeSchema("reminder.due", payloadSchema)

    it("validates complete envelope schema with standard attributes", () => {
      const envelope = {
        version: 1 as const,
        type: "reminder.due" as const,
        eventId: "123e4567-e89b-12d3-a456-426614174000",
        workspaceId: "223e4567-e89b-12d3-a456-426614174001",
        correlationId: "323e4567-e89b-12d3-a456-426614174002",
        occurredAt: "2026-10-24T12:00:00.000Z",
        idempotencyKey: "rem:123:2026-10-24",
        payload: {
          reminderId: "rem-123",
          dueAt: "2026-10-24T13:00:00.000Z",
        },
      }

      const res = validatePayload(envelopeSchema, envelope)
      expect(res.success).toBe(true)
    })
  })
})
