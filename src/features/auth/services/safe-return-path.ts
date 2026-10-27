import { safeReturnPathSchema } from "../schemas/auth.schema"

/**
 * Validates and sanitizes an internal return path.
 * Guaranteed to return an internal, safe relative path or the fallback.
 * Strictly prevents Open Redirect vulnerabilities.
 */
export function sanitizeReturnPath(candidate: string | null | undefined, fallback: string = "/"): string {
  if (!candidate || typeof candidate !== "string") {
    return fallback
  }

  const trimmed = candidate.trim()
  if (!trimmed) {
    return fallback
  }

  const result = safeReturnPathSchema.safeParse(trimmed)
  if (!result.success) {
    return fallback
  }

  return result.data
}

/**
 * Checks whether a candidate string is an approved internal application path.
 */
export function isSafeInternalPath(candidate: string | null | undefined): boolean {
  if (!candidate || typeof candidate !== "string") return false
  return safeReturnPathSchema.safeParse(candidate.trim()).success
}
