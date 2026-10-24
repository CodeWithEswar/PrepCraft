/**
 * Worker authentication utilities.
 * Uses standard Web Crypto APIs supported natively in Cloudflare Workers and modern Node runtimes.
 */

export interface VerifiedServiceCaller {
  authenticated: true
  serviceName: string
}

export interface AuthFailure {
  authenticated: false
  reason: string
}

/**
 * Validates an internal service-to-service authorization header.
 * Ensures the caller presents the expected shared secret without timing vulnerabilities.
 */
export async function verifyServiceToken(
  authHeader: string | null | undefined,
  expectedSecret: string,
  serviceName = "internal-service"
): Promise<VerifiedServiceCaller | AuthFailure> {
  if (!authHeader) {
    return { authenticated: false, reason: "Missing Authorization header" }
  }

  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return { authenticated: false, reason: "Invalid Authorization header format. Expected Bearer <token>" }
  }

  const token = parts[1]
  if (!expectedSecret || expectedSecret.length === 0) {
    return { authenticated: false, reason: "Service secret not configured" }
  }

  // Constant-time comparison using Web Crypto SHA-256 digests
  const encoder = new TextEncoder()
  const tokenHash = await crypto.subtle.digest("SHA-256", encoder.encode(token))
  const expectedHash = await crypto.subtle.digest("SHA-256", encoder.encode(expectedSecret))

  const tokenArray = new Uint8Array(tokenHash)
  const expectedArray = new Uint8Array(expectedHash)

  if (tokenArray.length !== expectedArray.length) {
    return { authenticated: false, reason: "Unauthorized" }
  }

  let mismatch = 0
  for (let i = 0; i < tokenArray.length; i++) {
    mismatch |= tokenArray[i] ^ expectedArray[i]
  }

  if (mismatch !== 0) {
    return { authenticated: false, reason: "Invalid service credentials" }
  }

  return { authenticated: true, serviceName }
}

export interface ExtractedJwtClaims {
  userId: string
  role?: string
  expiresAt: number
}

/**
 * Safely decodes a Supabase JWT payload without verifying signature (for edge routing / context extraction)
 * Signature verification must be performed by Supabase client or standard JWKS verifier.
 */
export function extractJwtClaims(jwtToken: string): ExtractedJwtClaims | null {
  try {
    const parts = jwtToken.split(".")
    if (parts.length !== 3) return null

    // Base64URL decode payload
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = atob(base64)
    const parsed = JSON.parse(jsonPayload)

    if (!parsed || typeof parsed !== "object" || !parsed.sub || !parsed.exp) {
      return null
    }

    return {
      userId: parsed.sub,
      role: parsed.role,
      expiresAt: parsed.exp,
    }
  } catch {
    return null
  }
}
