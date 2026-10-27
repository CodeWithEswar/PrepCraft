import { describe, it, expect } from "vitest"
import { rankTemplatesForTarget } from "../services/recommendation-service"
import type { PreparationTemplate, TemplateVersion } from "../types/template.types"

describe("Template Recommendation Service", () => {
  const amazonTemplate: PreparationTemplate = {
    id: "tmpl-amazon-sde",
    slug: "amazon-sde",
    name: "Amazon SDE",
    shortName: "Amazon",
    description: "Amazon curriculum",
    companyId: "amazon",
    roleId: "software-engineer",
    roleFamilyId: "software-engineering",
    templateType: "company_role",
    status: "published",
    visibility: "public",
    currentPublishedVersionId: "ver-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  const generalTemplate: PreparationTemplate = {
    id: "tmpl-general-swe",
    slug: "general-swe",
    name: "General Software Engineer",
    shortName: "General",
    description: "Foundational software engineer curriculum",
    companyId: null,
    roleId: null,
    roleFamilyId: "software-engineering",
    templateType: "general",
    status: "published",
    visibility: "public",
    currentPublishedVersionId: "ver-2",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  const frontendTemplate: PreparationTemplate = {
    id: "tmpl-frontend",
    slug: "frontend-engineer",
    name: "Frontend Engineer",
    shortName: "Frontend",
    description: "Web frontend track",
    companyId: null,
    roleId: "frontend-engineer",
    roleFamilyId: "software-engineering",
    templateType: "role",
    status: "published",
    visibility: "public",
    currentPublishedVersionId: "ver-3",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  const dummyVersion: TemplateVersion = {
    id: "ver-dummy",
    templateId: "dummy",
    versionNumber: 1,
    status: "published",
    changeSummary: null,
    reviewedAt: null,
    publishedAt: "2026-01-01T00:00:00Z",
    deprecatedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  const pairs = [
    { template: generalTemplate, version: dummyVersion },
    { template: amazonTemplate, version: dummyVersion },
    { template: frontendTemplate, version: dummyVersion },
  ]

  it("should rank exact company + role match at the very top with score 100", () => {
    const results = rankTemplatesForTarget(pairs, {
      companyName: "Amazon",
      roleName: "Software Engineer",
      roleFamily: "software-engineering",
    })

    expect(results[0].template.id).toBe("tmpl-amazon-sde")
    expect(results[0].score).toBe(100)
    expect(results[0].isStrongMatch).toBe(true)
    expect(results[0].reason).toContain("Exact match for your target at Amazon")
  })

  it("should rank role-specific template when company does not match", () => {
    const results = rankTemplatesForTarget(pairs, {
      companyName: "Startup Inc",
      roleName: "Frontend Engineer",
      roleFamily: "software-engineering",
    })

    expect(results[0].template.id).toBe("tmpl-frontend")
    expect(results[0].score).toBe(75)
    expect(results[0].isStrongMatch).toBe(true)
  })

  it("should provide general fallback when no specific company or role matches", () => {
    const results = rankTemplatesForTarget(pairs, {
      companyName: "Unknown Corp",
      roleName: "Unknown Role",
      roleFamily: "non-matching-family",
    })

    const generalResult = results.find((r) => r.template.id === "tmpl-general-swe")
    expect(generalResult).toBeDefined()
    expect(generalResult!.matchFactors.isFallback).toBe(true)
    expect(generalResult!.score).toBe(40)
  })
})
