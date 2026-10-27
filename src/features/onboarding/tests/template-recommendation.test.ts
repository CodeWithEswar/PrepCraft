// @vitest-environment node
import { describe, expect, it } from "vitest"
import {
  CANONICAL_TEMPLATES,
  recommendTemplate,
  suggestWorkspaceName,
} from "../services/template-recommendation"

describe("Template Recommendation & Workspace Naming", () => {
  it("contains 5 canonical preparation templates", () => {
    expect(CANONICAL_TEMPLATES).toHaveLength(5)
    const ids = CANONICAL_TEMPLATES.map((t) => t.id)
    expect(ids).toContain("amazon-sde")
    expect(ids).toContain("general-swe")
    expect(ids).toContain("frontend-engineer")
    expect(ids).toContain("backend-engineer")
    expect(ids).toContain("fullstack-engineer")
  })

  it("recommends amazon-sde template when company is Amazon", () => {
    expect(recommendTemplate("Software Engineer", "Amazon")).toBe("amazon-sde")
    expect(recommendTemplate("Backend Engineer", "Amazon Web Services")).toBe("amazon-sde")
  })

  it("recommends domain templates based on role family when company is general", () => {
    expect(recommendTemplate("Frontend Engineer", null)).toBe("frontend-engineer")
    expect(recommendTemplate("Backend Engineer", null)).toBe("backend-engineer")
    expect(recommendTemplate("Full-Stack Engineer", null)).toBe("fullstack-engineer")
    expect(recommendTemplate("Software Engineer", null)).toBe("general-swe")
  })

  it("suggests clean, contextual workspace names", () => {
    expect(suggestWorkspaceName("Software Engineer", "Amazon")).toBe("Amazon SDE I")
    expect(suggestWorkspaceName("Frontend Engineer", "Google")).toBe("Google Frontend Engineer")
    expect(suggestWorkspaceName("Backend Engineer", null)).toBe("Backend Engineer Preparation")
    expect(suggestWorkspaceName("Software Engineer", null)).toBe("General SDE Preparation")
    expect(suggestWorkspaceName(null, null)).toBe("General SDE Preparation")
  })
})
