import { rememberedAccountHintSchema } from "../schemas/auth.schema"
import type { LastUsedAccountHint } from "../types/auth.types"

const STORAGE_KEY = "prepcraft_last_account"
const ACCOUNT_CHANGE_EVENT = "prepcraft:account_hint_change"

export function subscribeToRememberedAccount(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(ACCOUNT_CHANGE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(ACCOUNT_CHANGE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

/**
 * Masks an email address for privacy-conscious display.
 * Example: 'chintu.sharma@gmail.com' -> 'ch••••••••••@gmail.com'
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "••••••••"
  const [localPart, domain] = email.split("@")
  if (!localPart || !domain) return "••••••••"

  if (localPart.length <= 2) {
    return `${localPart[0]}•@${domain}`
  }

  const visiblePrefix = localPart.slice(0, 2)
  const maskedLength = Math.max(localPart.length - 2, 4)
  const dots = "•".repeat(Math.min(maskedLength, 8))

  return `${visiblePrefix}${dots}@${domain}`
}

let cachedRaw: string | null = null
let cachedHint: LastUsedAccountHint | null = null

/**
 * Reads and validates the locally remembered account hint on this device.
 * Local convenience ONLY. Never queries the server to prevent account enumeration.
 * Cached to ensure referential stability for useSyncExternalStore.
 */
export function getRememberedAccount(): LastUsedAccountHint | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw) {
      return cachedHint
    }

    cachedRaw = raw
    if (!raw) {
      cachedHint = null
      return null
    }

    const parsed = JSON.parse(raw)
    const result = rememberedAccountHintSchema.safeParse(parsed)
    if (!result.success) {
      window.localStorage.removeItem(STORAGE_KEY)
      cachedRaw = null
      cachedHint = null
      return null
    }

    cachedHint = result.data
    return cachedHint
  } catch {
    cachedRaw = null
    cachedHint = null
    return null
  }
}

/**
 * Persists a minimal account hint to local device storage after verified login.
 */
export function saveRememberedAccount(data: {
  email: string
  displayName?: string
  avatarUrl?: string
}): void {
  if (typeof window === "undefined") return

  try {
    const hint: LastUsedAccountHint = {
      email: data.email,
      maskedEmail: maskEmail(data.email),
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      lastUsedAt: new Date().toISOString(),
    }

    const validated = rememberedAccountHintSchema.safeParse(hint)
    if (validated.success) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validated.data))
      window.dispatchEvent(new Event(ACCOUNT_CHANGE_EVENT))
    }
  } catch {
    // Local storage disabled or quota exceeded; fails gracefully
  }
}

/**
 * Clears the remembered account hint on this device ("Not you?" action).
 */
export function clearRememberedAccount(): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event(ACCOUNT_CHANGE_EVENT))
  } catch {
    // Ignore storage failure
  }
}
