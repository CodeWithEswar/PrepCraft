import { describe, it, expect } from "vitest"
import { computeCurriculumDiff, type VersionCurriculumSnapshot } from "../services/template-diff-service"

describe("Template Diff Service", () => {
  const v1Snapshot: VersionCurriculumSnapshot = {
    versionNumber: 1,
    tracks: [
      {
        id: "tr1",
        templateVersionId: "v1",
        trackId: "track-dsa",
        trackName: "Data Structures",
        priority: "core",
        weight: 35,
        recommendedMinutesPercent: 35,
        sortOrder: 1,
        required: true,
        notes: null,
      },
    ],
    topics: [
      {
        id: "top1",
        templateVersionId: "v1",
        trackId: "track-dsa",
        topicId: "dsa-arrays",
        topicName: "Arrays",
        priority: "medium",
        weight: 10,
        recommendedQuestionCount: 10,
        recommendedRevisionDepth: 2,
        sortOrder: 1,
        required: true,
      },
      {
        id: "top2",
        templateVersionId: "v1",
        trackId: "track-dsa",
        topicId: "dsa-deprecated",
        topicName: "Old Topic",
        priority: "low",
        weight: 5,
        recommendedQuestionCount: 5,
        recommendedRevisionDepth: 1,
        sortOrder: 2,
        required: false,
      },
    ],
    patterns: [],
  }

  const v2Snapshot: VersionCurriculumSnapshot = {
    versionNumber: 2,
    tracks: [
      {
        id: "tr1",
        templateVersionId: "v2",
        trackId: "track-dsa",
        trackName: "Data Structures",
        priority: "core",
        weight: 40, // weight changed: 35 -> 40
        recommendedMinutesPercent: 40,
        sortOrder: 1,
        required: true,
        notes: null,
      },
      {
        id: "tr2",
        templateVersionId: "v2",
        trackId: "track-graphs",
        trackName: "Graph Fundamentals", // track added
        priority: "high",
        weight: 15,
        recommendedMinutesPercent: 15,
        sortOrder: 2,
        required: true,
        notes: null,
      },
    ],
    topics: [
      {
        id: "top1",
        templateVersionId: "v2",
        trackId: "track-dsa",
        topicId: "dsa-arrays",
        topicName: "Arrays",
        priority: "high", // priority changed: medium -> high
        weight: 10,
        recommendedQuestionCount: 15,
        recommendedRevisionDepth: 2,
        sortOrder: 1,
        required: true,
      },
      {
        id: "top3",
        templateVersionId: "v2",
        trackId: "track-graphs",
        topicId: "graphs-bfs",
        topicName: "Breadth-First Search", // topic added
        priority: "high",
        weight: 10,
        recommendedQuestionCount: 8,
        recommendedRevisionDepth: 2,
        sortOrder: 2,
        required: true,
      },
    ], // dsa-deprecated was removed from v2
    patterns: [
      {
        id: "pat1",
        templateVersionId: "v2",
        patternId: "pat-bfs",
        patternName: "BFS Traversal",
        trackId: "track-graphs",
        priority: "high",
        recommendedAttempts: 5,
        sortOrder: 1,
      },
    ],
  }

  it("should accurately detect added tracks and topics", () => {
    const diff = computeCurriculumDiff(v1Snapshot, v2Snapshot)
    expect(diff.tracksAdded.length).toBe(1)
    expect(diff.tracksAdded[0].trackId).toBe("track-graphs")

    expect(diff.topicsAdded.length).toBe(1)
    expect(diff.topicsAdded[0].topicId).toBe("graphs-bfs")
  })

  it("should detect priority and weight adjustments", () => {
    const diff = computeCurriculumDiff(v1Snapshot, v2Snapshot)
    expect(diff.priorityChanged.length).toBe(1)
    expect(diff.priorityChanged[0].topicId).toBe("dsa-arrays")
    expect(diff.priorityChanged[0].oldPriority).toBe("medium")
    expect(diff.priorityChanged[0].newPriority).toBe("high")

    expect(diff.weightChanged.length).toBe(1)
    expect(diff.weightChanged[0].trackId).toBe("track-dsa")
    expect(diff.weightChanged[0].oldWeight).toBe(35)
    expect(diff.weightChanged[0].newWeight).toBe(40)
  })

  it("should detect removed topics while providing progress preservation guarantee", () => {
    const diff = computeCurriculumDiff(v1Snapshot, v2Snapshot)
    expect(diff.topicsRemoved.length).toBe(1)
    expect(diff.topicsRemoved[0].topicId).toBe("dsa-deprecated")
    expect(diff.preservedProgressGuarantee).toContain("permanently intact")
  })
})
