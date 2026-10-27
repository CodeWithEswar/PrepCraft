import { describe, it, expect } from "vitest"
import {
  validateTemplateIntegrity,
  assertVersionIsMutable,
} from "../services/template-validation-service"
import type { TemplateVersion } from "../types/template.types"

describe("Template Validation Service", () => {
  it("should fail validation if template has no name or slug", () => {
    const res = validateTemplateIntegrity({
      template: { name: "", slug: "" },
      version: { versionNumber: 1 },
      tracks: [
        {
          id: "1",
          templateVersionId: "v1",
          trackId: "track-dsa",
          trackName: "DSA",
          priority: "core",
          weight: 50,
          recommendedMinutesPercent: 50,
          sortOrder: 1,
          required: true,
          notes: null,
        },
      ],
      topics: [],
    })

    expect(res.valid).toBe(false)
    expect(res.errors).toContain("Template must have a non-empty name.")
    expect(res.errors).toContain("Template must have a unique slug.")
  })

  it("should fail if template has 0 tracks", () => {
    const res = validateTemplateIntegrity({
      template: { name: "Amazon SDE", slug: "amazon-sde" },
      version: { versionNumber: 1 },
      tracks: [],
      topics: [],
    })

    expect(res.valid).toBe(false)
    expect(res.errors).toContain("Template must contain at least one preparation track.")
  })

  it("should detect topics referencing tracks not assigned to the template", () => {
    const res = validateTemplateIntegrity({
      template: { name: "Amazon SDE", slug: "amazon-sde" },
      version: { versionNumber: 1 },
      tracks: [
        {
          id: "1",
          templateVersionId: "v1",
          trackId: "track-dsa",
          trackName: "DSA",
          priority: "core",
          weight: 50,
          recommendedMinutesPercent: 50,
          sortOrder: 1,
          required: true,
          notes: null,
        },
      ],
      topics: [
        {
          id: "top-1",
          templateVersionId: "v1",
          trackId: "track-unassigned-systems",
          topicId: "systems-concurrency",
          topicName: "Concurrency",
          priority: "high",
          weight: 10,
          recommendedQuestionCount: 5,
          recommendedRevisionDepth: 2,
          sortOrder: 1,
          required: true,
        },
      ],
    })

    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes("references track track-unassigned-systems"))).toBe(true)
  })

  it("should prevent mutating published or archived template versions", () => {
    const publishedVersion: TemplateVersion = {
      id: "v-pub",
      templateId: "tmpl-1",
      versionNumber: 1,
      status: "published",
      changeSummary: null,
      reviewedAt: null,
      publishedAt: "2026-01-01T00:00:00Z",
      deprecatedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    }

    expect(() => assertVersionIsMutable(publishedVersion)).toThrow(
      /Cannot mutate template version 1 in 'published' state/
    )
  })
})
