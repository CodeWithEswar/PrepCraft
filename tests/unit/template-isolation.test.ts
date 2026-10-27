import { describe, it, expect } from "vitest"
import { resolveEffectiveCurriculum } from "@/features/templates/services/curriculum-resolver"
import { templateQueryKeys } from "@/features/templates/services/template-query-keys"
import type { PreparationTemplate, TemplateVersion } from "@/features/templates/types/template.types"

describe("Template Workspace Isolation & Non-Destructive Semantics", () => {
  const workspaceAId = "aaaa1111-1111-1111-1111-111111111111"
  const workspaceBId = "bbbb2222-2222-2222-2222-222222222222"

  const amazonTemplate: PreparationTemplate = {
    id: "tmpl-amazon-sde",
    slug: "amazon-sde",
    name: "Amazon SDE",
    shortName: "Amazon",
    description: "Amazon SDE track",
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
    description: "General SWE track",
    companyId: null,
    roleId: null,
    roleFamilyId: "software-engineering",
    templateType: "general",
    status: "published",
    visibility: "public",
    currentPublishedVersionId: "ver-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  const ver1: TemplateVersion = {
    id: "ver-1",
    templateId: "dummy",
    versionNumber: 1,
    status: "published",
    changeSummary: "v1 initial",
    reviewedAt: null,
    publishedAt: "2026-01-01T00:00:00Z",
    deprecatedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  describe("Query Key Isolation", () => {
    it("ensures workspace curriculum query keys are strictly partitioned by workspaceId", () => {
      const keysA = {
        curriculum: templateQueryKeys.workspaceCurriculum(workspaceAId),
        template: templateQueryKeys.workspaceTemplate(workspaceAId),
      }

      const keysB = {
        curriculum: templateQueryKeys.workspaceCurriculum(workspaceBId),
        template: templateQueryKeys.workspaceTemplate(workspaceBId),
      }

      expect(keysA.curriculum).not.toEqual(keysB.curriculum)
      expect(keysA.template).not.toEqual(keysB.template)
      expect(keysA.curriculum[1]).toBe(workspaceAId)
      expect(keysB.curriculum[1]).toBe(workspaceBId)
    })
  })

  describe("Effective Curriculum Isolation", () => {
    it("maintains independent effective curricula for separate workspaces", () => {
      // Workspace A on Amazon SDE
      const wsACurriculum = resolveEffectiveCurriculum({
        workspaceId: workspaceAId,
        template: amazonTemplate,
        version: ver1,
        tracks: [
          {
            id: "tr1",
            templateVersionId: "ver-1",
            trackId: "track-dsa",
            trackName: "DSA",
            priority: "core",
            weight: 40,
            recommendedMinutesPercent: 40,
            sortOrder: 1,
            required: true,
            notes: null,
          },
        ],
        topics: [],
        patterns: [],
        stages: [],
        readinessRequirements: [],
      })

      // Workspace B on General SWE
      const wsBCurriculum = resolveEffectiveCurriculum({
        workspaceId: workspaceBId,
        template: generalTemplate,
        version: ver1,
        tracks: [
          {
            id: "tr2",
            templateVersionId: "ver-1",
            trackId: "track-cs-core",
            trackName: "CS Core",
            priority: "high",
            weight: 25,
            recommendedMinutesPercent: 25,
            sortOrder: 1,
            required: true,
            notes: null,
          },
        ],
        topics: [],
        patterns: [],
        stages: [],
        readinessRequirements: [],
      })

      expect(wsACurriculum.workspaceId).toBe(workspaceAId)
      expect(wsACurriculum.templateId).toBe("tmpl-amazon-sde")
      expect(wsACurriculum.tracks[0].trackId).toBe("track-dsa")

      expect(wsBCurriculum.workspaceId).toBe(workspaceBId)
      expect(wsBCurriculum.templateId).toBe("tmpl-general-swe")
      expect(wsBCurriculum.tracks[0].trackId).toBe("track-cs-core")
    })
  })

  describe("Separation of Recommendations and Progress", () => {
    it("ensures template recommendation models contain zero user-state fields", () => {
      const templateKeys = Object.keys(amazonTemplate)
      expect(templateKeys).not.toContain("attempts")
      expect(templateKeys).not.toContain("mastery")
      expect(templateKeys).not.toContain("completedQuestions")
      expect(templateKeys).not.toContain("userId")
      expect(templateKeys).not.toContain("workspaceId")

      const versionKeys = Object.keys(ver1)
      expect(versionKeys).not.toContain("attempts")
      expect(versionKeys).not.toContain("progress")
      expect(versionKeys).not.toContain("userId")
    })
  })
})
