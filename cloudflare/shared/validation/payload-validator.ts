import { z } from "zod"

export type ErrorClassification = "TERMINAL" | "RETRYABLE"

export interface ClassifiedError {
  classification: ErrorClassification
  message: string
  details?: unknown
}

/**
 * Validates an incoming queue message or worker request against a Zod schema.
 * Throws or returns a structured error classified as TERMINAL (permanent failure)
 * so that dead-letter or immediate rejection can occur without infinite retries.
 */
export function validatePayload<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ClassifiedError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    error: {
      classification: "TERMINAL",
      message: `Payload validation failed: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
      details: result.error.issues,
    },
  }
}

/**
 * Classifies an error into RETRYABLE or TERMINAL for queue consumer retry policies.
 * Network errors, timeouts, and 5xx downstream errors are RETRYABLE.
 * Schema validation, 4xx client errors, auth failures, and malformed inputs are TERMINAL.
 */
export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof z.ZodError) {
    return {
      classification: "TERMINAL",
      message: `Validation error: ${error.message}`,
      details: error.issues,
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()

    // Common transient conditions
    if (
      msg.includes("timeout") ||
      msg.includes("econnrefused") ||
      msg.includes("econnreset") ||
      msg.includes("network") ||
      msg.includes("rate limit") ||
      msg.includes("429") ||
      msg.includes("503") ||
      msg.includes("502") ||
      msg.includes("504")
    ) {
      return {
        classification: "RETRYABLE",
        message: error.message,
      }
    }

    // Explicit terminal markers
    if (
      msg.includes("unauthorized") ||
      msg.includes("forbidden") ||
      msg.includes("not found") ||
      msg.includes("malformed") ||
      msg.includes("invalid version") ||
      msg.includes("schema")
    ) {
      return {
        classification: "TERMINAL",
        message: error.message,
      }
    }

    // Default general errors to RETRYABLE to avoid dropping work unexpectedly, unless classified
    return {
      classification: "RETRYABLE",
      message: error.message,
    }
  }

  return {
    classification: "TERMINAL",
    message: String(error),
  }
}
