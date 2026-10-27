import { describe, it, expect } from "vitest"
import { resolveEffectiveCurriculum } from "../services/curriculum-resolver"
import type {
  PreparationTemplate,
  TemplateVersion,
  TemplateVersionTrack,
  TemplateVersionTopic,
  TemplateVersionPattern,
  TemplateInterviewStage,
  TemplateReadinessRequirement,
} from "../types/template.types"

describe("Curriculum Resolver Service", () => {
  const dummyTemplate: PreparationTemplate = {
    id: "tmpl-amazon",
    slug: "amazon-sde",
    name: "Amazon SDE",
    shortName: "Amazon",
    description: "Amazon Track",
    companyId: "amazon",
    roleId: "swe",
    roleFamilyId: "swe",
    templateType: "company_role",
    status: "published",
    visibility: "public",
    currentPublishedVersionId: "ver-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  const dummyVersion: TemplateVersion = {
    id: "ver-1",
    templateId: "tmpl-amazon",
    versionNumber: 1,
    status: "published",
    changeSummary: "Initial version",
    reviewedAt: null,
    publishedAt: "2026-01-01T00:00:00Z",
    deprecatedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  const tracks: TemplateVersionTrack[] = [
    {
      id: "t1",
      templateVersionId: "ver-1",
      trackId: "track-dsa",
      trackName: "Data Structures & Algorithms",
      priority: "core",
      weight: 35,
      recommendedMinutesPercent: 35,
      sortOrder: 1,
      required: true,
      notes: "Core technical interview bar",
    },
    {
      id: "t2",
      templateVersionId: "ver-1",
      trackId: "track-lang",
      trackName: "Programming Language",
      priority: "high",
      weight: 15,
      recommendedMinutesPercent: 15,
      sortOrder: 2,
      required: true,
      notes: null,
    },
    {
      id: "t3",
      templateVersionId: "ver-1",
      trackId: "track-behavioral",
      trackName: "Behavioral & Principles",
      priority: "core",
      weight: 20,
      recommendedMinutesPercent: 20,
      sortOrder: 3,
      required: true,
      notes: null,
    },
  ]

  const topics: TemplateVersionTopic[] = [
    {
      id: "top1",
      templateVersionId: "ver-1",
      trackId: "track-dsa",
      topicId: "dsa-arrays",
      topicName: "Arrays & Strings",
      priority: "high",
      weight: 10,
      recommendedQuestionCount: 15,
      recommendedRevisionDepth: 2,
      sortOrder: 1,
      required: true,
    },
    {
      id: "top2",
      templateVersionId: "ver-1",
      trackId: "track-dsa",
      topicId: "dsa-trees",
      topicName: "Trees & Binary Search Trees",
      priority: "high",
      weight: 12,
      recommendedQuestionCount: 12,
      recommendedRevisionDepth: 3,
      sortOrder: 2,
      required: true,
    },
  ]

  const patterns: TemplateVersionPattern[] = [
    {
      id: "pat1",
      templateVersionId: "ver-1",
      patternId: "pat-two-pointers",
      patternName: "Two Pointers",
      trackId: "track-dsa",
      priority: "high",
      recommendedAttempts: 6,
      sortOrder: 1,
    },
  ]

  const stages: TemplateInterviewStage[] = [
    {
      id: "stg1",
      templateVersionId: "ver-1",
      name: "Online Assessment",
      stageType: "oa",
      sortOrder: 1,
      optional: false,
      description: "Timed OA test",
    },
  ]

  const readiness: TemplateReadinessRequirement[] = [
    {
      id: "r1",
      templateVersionId: "ver-1",
      dimension: "dsa",
      minimumEvidence: ">= 40 problems solved independently",
      weight: 40,
      required: true,
    },
  ]

  it("should resolve effective tracks and adapt language track to interview language", () => {
    const effective = resolveEffectiveCurriculum({
      workspaceId: "ws-123",
      template: dummyTemplate,
      version: dummyVersion,
      tracks,
      topics,
      patterns,
      stages,
      readinessRequirements: readiness,
      interviewLanguage: "java",
    })

    expect(effective.tracks.length).toBe(3)
    const langTrack = effective.tracks.find((t) => t.trackId === "track-lang")
    expect(langTrack).toBeDefined()
    expect(langTrack!.name).toBe("Programming Language (Java)")
    expect(langTrack!.notes).toContain("Java")
  })

  it("should compute normalized planning allocation weights that sum to 100%", () => {
    const effective = resolveEffectiveCurriculum({
      workspaceId: "ws-123",
      template: dummyTemplate,
      version: dummyVersion,
      tracks,
      topics,
      patterns,
      stages,
      readinessRequirements: readiness,
    })

    const totalPercentage = effective.planningAllocation.reduce(
      (sum, item) => sum + item.percentage,
      0
    )
    expect(totalPercentage).toBe(100)
  })

  it("should honor workspace priority and weight overrides without mutating template definition", () => {
    const effective = resolveEffectiveCurriculum({
      workspaceId: "ws-123",
      template: dummyTemplate,
      version: dummyVersion,
      tracks,
      topics,
      patterns,
      stages,
      readinessRequirements: readiness,
      overrides: [
        {
          entityType: "topic",
          entityId: "dsa-arrays",
          overrideType: "priority",
          value: { priority: "core" },
        },
      ],
    })

    const arraysTopic = effective.tracks[0].topics.find((t) => t.topicId === "dsa-arrays")
    expect(arraysTopic!.priority).toBe("core")
    expect(arraysTopic!.origin).toBe("user_override")
    expect(effective.status).toBe("customized")
  })
})
