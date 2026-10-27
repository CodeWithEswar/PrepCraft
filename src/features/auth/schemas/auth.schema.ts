import { z } from "zod"

/**
 * Validates internal return paths to strictly prevent Open Redirect attacks.
 * Disallows:
 * - External schemes: http:, https:, javascript:, data:, etc.
 * - Protocol-relative URLs: //evil.com
 * - Backslash bypasses: /\evil.com, \evil.com
 * - Relative traversals: ../, ..
 * - Control characters and CRLF injection
 */
export const safeReturnPathSchema = z
  .string()
  .trim()
  .refine(
    (path) => {
      if (!path.startsWith("/")) return false
      // Disallow protocol-relative URLs (//) or backslash variations (/\ or \)
      if (path.startsWith("//") || path.startsWith("/\\") || path.includes("\\")) return false
      // Disallow URI schemes before the first slash (e.g. "https://", "javascript:")
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return false
      // Disallow directory traversal
      if (path.includes("/../") || path.endsWith("/..") || path === "..") return false
      // Disallow control characters
      if (/[\x00-\x1F\x7F]/.test(path)) return false
      return true
    },
    { message: "Return path must be a valid, safe internal application route." }
  )
  .refine(
    (path) => {
      // Must target recognized application sections
      const allowedPrefixes = ["/w/", "/onboarding", "/settings", "/profile", "/dev"]
      return allowedPrefixes.some((prefix) => path === prefix || path.startsWith(prefix))
    },
    { message: "Return path is outside permitted application areas." }
  )

export const rememberedAccountHintSchema = z.object({
  email: z.string().email(),
  maskedEmail: z.string().min(3),
  displayName: z.string().trim().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  lastUsedAt: z.string().datetime(),
})

export const authCallbackQuerySchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
  returnTo: z.string().optional(),
})

export const loginPageQuerySchema = z.object({
  returnTo: z.string().optional(),
  reason: z.enum(["session_expired", "access_revoked", "oauth_failed", "unauthenticated"]).optional(),
  error: z.string().optional(),
})

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(60).optional(),
  graduationYear: z.number().int().min(1980).max(2100).nullable().optional(),
  collegeName: z.string().trim().max(120).nullable().optional(),
  preferredCodingLanguage: z.enum(["java", "python", "cpp", "javascript", "other"]).nullable().optional(),
  timezone: z.string().trim().min(1).max(60).optional(),
})
