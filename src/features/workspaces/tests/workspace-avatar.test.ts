import { describe, it, expect } from "vitest"
import {
  getWorkspaceInitials,
  getWorkspaceMarkStyle,
} from "../utils/workspace-avatar"

describe("getWorkspaceInitials", () => {
  it("derives deterministic 2-letter uppercase initials for multi-word names", () => {
    expect(getWorkspaceInitials("Amazon SDE I")).toBe("AS")
    expect(getWorkspaceInitials("TCS Prime")).toBe("TP")
    expect(getWorkspaceInitials("Google SWE")).toBe("GS")
    expect(getWorkspaceInitials("General Software Engineer")).toBe("GS")
  })

  it("handles single-word workspace names", () => {
    expect(getWorkspaceInitials("Amazon")).toBe("AM")
    expect(getWorkspaceInitials("PrepCraft")).toBe("PR")
  })

  it("handles edge cases and empty names gracefully", () => {
    expect(getWorkspaceInitials("")).toBe("WP")
    expect(getWorkspaceInitials("   ")).toBe("WP")
    expect(getWorkspaceInitials("A")).toBe("A")
  })
})

describe("getWorkspaceMarkStyle", () => {
  it("returns deterministic sienna/mineral styling based on seed", () => {
    const style1 = getWorkspaceMarkStyle("Amazon SDE I")
    const style2 = getWorkspaceMarkStyle("Amazon SDE I")

    expect(style1).toEqual(style2)
    expect(style1.backgroundColor).toBeDefined()
    expect(style1.color).toBeDefined()
    expect(style1.borderColor).toBeDefined()
  })

  it("strictly sticks to graphite/sienna palette", () => {
    const seeds = ["Amazon", "Google", "TCS", "Infosys", "General"]
    for (const seed of seeds) {
      const style = getWorkspaceMarkStyle(seed)
      // Check that none of the colors use blue, green, purple, cyan etc.
      expect(style.color).not.toMatch(/blue|teal|green|violet|purple|cyan/)
      expect(style.backgroundColor).not.toMatch(/blue|teal|green|violet|purple|cyan/)
    }
  })
})
