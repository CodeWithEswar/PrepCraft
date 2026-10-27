// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest"
import {
  maskEmail,
  getRememberedAccount,
  saveRememberedAccount,
  clearRememberedAccount,
} from "@/features/auth/utils/remembered-account"

describe("Remembered Account Device Hint & Privacy Masking", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("masks email addresses while preserving recognizable domain context", () => {
    expect(maskEmail("chintu@gmail.com")).toBe("ch••••@gmail.com")
    expect(maskEmail("alexander@outlook.com")).toBe("al•••••••@outlook.com")
    expect(maskEmail("ab@test.com")).toBe("a•@test.com")
    expect(maskEmail("dev@prepcraft.dev")).toBe("de••••@prepcraft.dev")
  })

  it("handles malformed emails safely without throwing", () => {
    expect(maskEmail("")).toBe("••••••••")
    expect(maskEmail("invalid-email")).toBe("••••••••")
    expect(maskEmail("@nodomain")).toBe("••••••••")
  })

  it("saves and parses valid remembered account hints in local storage", () => {
    saveRememberedAccount({
      email: "engineer@gmail.com",
      displayName: "PrepCraft Engineer",
      avatarUrl: "https://lh3.googleusercontent.com/avatar123",
    })

    const hint = getRememberedAccount()
    expect(hint).not.toBeNull()
    expect(hint?.email).toBe("engineer@gmail.com")
    expect(hint?.maskedEmail).toBe("en••••••@gmail.com")
    expect(hint?.displayName).toBe("PrepCraft Engineer")
    expect(hint?.avatarUrl).toBe("https://lh3.googleusercontent.com/avatar123")
    expect(hint?.lastUsedAt).toBeDefined()
  })

  it("handles corrupted or untrusted localStorage data by clearing and returning null", () => {
    // Malformed JSON
    window.localStorage.setItem("prepcraft_last_account", "not-a-valid-json")
    expect(getRememberedAccount()).toBeNull()

    // Invalid schema structure (e.g. missing required fields or invalid email)
    window.localStorage.setItem(
      "prepcraft_last_account",
      JSON.stringify({ email: "invalid-email", randomField: 123 })
    )
    expect(getRememberedAccount()).toBeNull()
    expect(window.localStorage.getItem("prepcraft_last_account")).toBeNull()
  })

  it("clears remembered account hint completely when clearRememberedAccount is called", () => {
    saveRememberedAccount({
      email: "candidate@gmail.com",
    })
    expect(getRememberedAccount()).not.toBeNull()

    clearRememberedAccount()
    expect(getRememberedAccount()).toBeNull()
    expect(window.localStorage.getItem("prepcraft_last_account")).toBeNull()
  })
})
