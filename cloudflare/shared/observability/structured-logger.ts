/**
 * Structured logger for Cloudflare Workers, Queue Consumers, and Cron Triggers.
 * Enforces structured JSON output and strictly sanitizes credentials and PII.
 */

export interface LogContext {
  worker: string
  requestId?: string
  eventId?: string
  queue?: string
  operation: string
  workspaceId?: string
  durationMs?: number
  outcome?: "success" | "retryable_failure" | "terminal_failure" | "in_progress"
  errorCategory?: string
  [key: string]: unknown
}

const REDACTED_KEYS = new Set([
  "authorization",
  "bearer",
  "token",
  "secret",
  "apikey",
  "api_key",
  "password",
  "service_role",
  "cookie",
  "set-cookie",
])

/**
 * Recursively sanitizes an object to redact credentials, tokens, and sensitive headers.
 */
export function sanitizeLogData(data: unknown): unknown {
  if (data === null || data === undefined) return data
  if (typeof data !== "object") return data

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData)
  }

  const record = data as Record<string, unknown>
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(record)) {
    const lowerKey = key.toLowerCase()
    if (
      REDACTED_KEYS.has(lowerKey) ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token") ||
      lowerKey.includes("password") ||
      lowerKey.includes("apikey") ||
      lowerKey.includes("api_key") ||
      lowerKey.includes("auth")
    ) {
      sanitized[key] = "[REDACTED]"
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

export class WorkerLogger {
  private baseContext: Partial<LogContext>

  constructor(baseContext: Partial<LogContext>) {
    this.baseContext = baseContext
  }

  info(message: string, context?: Partial<LogContext>): void {
    this.emit("INFO", message, context)
  }

  warn(message: string, context?: Partial<LogContext>): void {
    this.emit("WARN", message, context)
  }

  error(message: string, _error?: unknown, context?: Partial<LogContext>): void {
    // External errors can embed credentials, SQL, URLs or user text. Never serialize them.
    this.emit("ERROR", message, { errorCategory:"internal_error", ...context })
  }

  private emit(level: "INFO" | "WARN" | "ERROR", message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString()
    const input={...this.baseContext,...context},safe:Record<string,unknown>={}
    for(const key of ["worker","operation","queue","channel","outcome","errorCategory"]){const value=input[key];if(typeof value==="string"&&/^[A-Za-z0-9_.-]{1,100}$/.test(value))safe[key]=value}
    for(const key of ["requestId","eventId","correlationId","workspaceId"]){const value=input[key];if(typeof value==="string"&&/^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(value))safe[key]=value}
    for(const key of ["durationMs","count"]){const value=input[key];if(typeof value==="number"&&Number.isFinite(value)&&value>=0)safe[key]=value}
    const merged={timestamp,level,message:/^[A-Za-z0-9_. -]{1,100}$/.test(message)?message:"operation_failed",...safe}

    const serialized = JSON.stringify(merged)
    if (level === "ERROR") {
      console.error(serialized)
    } else if (level === "WARN") {
      console.warn(serialized)
    } else {
      console.log(serialized)
    }
  }
}

export function createWorkerLogger(baseContext: Partial<LogContext>): WorkerLogger {
  return new WorkerLogger(baseContext)
}
