// @vitest-environment node
import { describe, expect, it } from "vitest"
import { slugifyWorkspaceName } from "../services/workspace-slug"

describe("Workspace Slug Generator", () => {
  it("converts workspace names to URL-safe lowercased slugs", () => {
    expect(slugifyWorkspaceName("Amazon SDE I")).toBe("amazon-sde-i")
    expect(slugifyWorkspaceName("General Software Engineer")).toBe("general-software-engineer")
    expect(slugifyWorkspaceName("Frontend Engineer @ Stripe!")).toBe("frontend-engineer-stripe")
    expect(slugifyWorkspaceName("  Backend / Distributed Prep  ")).toBe("backend-distributed-prep")
  })

  it("handles empty or special character inputs with fallback", () => {
    expect(slugifyWorkspaceName("")).toBe("prep-workspace")
    expect(slugifyWorkspaceName("!!!???")).toBe("prep-workspace")
    expect(slugifyWorkspaceName("---")).toBe("prep-workspace")
  })
})
