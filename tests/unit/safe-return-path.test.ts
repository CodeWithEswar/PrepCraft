// @vitest-environment node
import { describe, expect, it } from "vitest"
import { sanitizeReturnPath, isSafeInternalPath } from "@/features/auth/services/safe-return-path"

describe("Open Redirect Protection & Safe Return Path Service", () => {
  it("approves valid internal application paths", () => {
    const validPaths = [
      "/w/amazon-sde/practice",
      "/w/google-l4/today",
      "/w/uber-sde2/interview",
      "/onboarding",
      "/onboarding/profile",
      "/onboarding/workspace",
      "/settings",
      "/profile",
    ]

    for (const path of validPaths) {
      expect(isSafeInternalPath(path)).toBe(true)
      expect(sanitizeReturnPath(path, "/fallback")).toBe(path)
    }
  })

  it("strictly rejects external URLs with protocols", () => {
    const externalUrls = [
      "https://evil.example.com",
      "http://evil.example.com",
      "https://attacker.com/w/amazon-sde",
      "javascript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "file:///etc/passwd",
    ]

    for (const url of externalUrls) {
      expect(isSafeInternalPath(url)).toBe(false)
      expect(sanitizeReturnPath(url, "/default")).toBe("/default")
    }
  })

  it("strictly rejects protocol-relative URLs", () => {
    const protocolRelativeUrls = [
      "//evil.example.com",
      "//attacker.com/login",
      "///evil.example.com",
    ]

    for (const url of protocolRelativeUrls) {
      expect(isSafeInternalPath(url)).toBe(false)
      expect(sanitizeReturnPath(url, "/default")).toBe("/default")
    }
  })

  it("strictly rejects backslash bypass variations", () => {
    const backslashBypasses = [
      "/\\evil.com",
      "\\evil.com",
      "/path\\with\\backslashes",
      "\\/evil.com",
    ]

    for (const bypass of backslashBypasses) {
      expect(isSafeInternalPath(bypass)).toBe(false)
      expect(sanitizeReturnPath(bypass, "/default")).toBe("/default")
    }
  })

  it("strictly rejects directory traversal paths", () => {
    const traversals = [
      "/w/amazon-sde/../../evil",
      "/w/..",
      "/login/..",
      "..",
      "/../etc/passwd",
    ]

    for (const path of traversals) {
      expect(isSafeInternalPath(path)).toBe(false)
      expect(sanitizeReturnPath(path, "/default")).toBe("/default")
    }
  })

  it("strictly rejects unrecognized top-level routes outside application boundary", () => {
    const unauthorizedPaths = [
      "/admin",
      "/internal",
      "/metrics",
      "/random-unknown-page",
    ]

    for (const path of unauthorizedPaths) {
      expect(isSafeInternalPath(path)).toBe(false)
      expect(sanitizeReturnPath(path, "/default")).toBe("/default")
    }
  })

  it("handles null, undefined, empty, and whitespace strings gracefully", () => {
    expect(sanitizeReturnPath(null, "/fallback")).toBe("/fallback")
    expect(sanitizeReturnPath(undefined, "/fallback")).toBe("/fallback")
    expect(sanitizeReturnPath("", "/fallback")).toBe("/fallback")
    expect(sanitizeReturnPath("   ", "/fallback")).toBe("/fallback")
    expect(isSafeInternalPath(null)).toBe(false)
    expect(isSafeInternalPath(undefined)).toBe(false)
    expect(isSafeInternalPath("")).toBe(false)
  })
})
