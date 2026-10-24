import "server-only"
import { createLogRecord } from "./log-record"

export function logEvent(level: "info" | "warn" | "error", event: string, context?: unknown) {
  console[level](JSON.stringify(createLogRecord(level, event, context)))
}
