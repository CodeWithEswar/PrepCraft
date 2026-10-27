import {
  evaluateSessionFacets,
  RawSessionEvidence,
} from "../policies/evaluation-policy-v1"
import type {
  MockQuestionReviewItem,
  MockReview,
  MockSession,
  NextWeekBridgeProposal,
} from "../types/mock.types"
import { normalizeSessionEvidence } from "./evidence-normalizer"

export function generateMockReview(
  session: MockSession,
  completedAtIso: string,
  selfReportedCommunication?: string | null
): MockReview {
  const evidence = normalizeSessionEvidence(session, completedAtIso, selfReportedCommunication)
  const facets = evaluateSessionFacets(evidence)
  const durationMinutes = Math.max(1, Math.round(evidence.actualDurationSeconds / 60))

  const allItems = session.sections.flatMap((s) => s.items)

  // Primary finding with high trust and provenance
  const primaryFinding = {
    title: "Testing Under Time Pressure",
    status: facets.testing.status,
    confidence: facets.testing.confidence,
    provenance: facets.testing.provenance,
    whyItMatters:
      "The captured evidence suggests that implementation speed was acceptable, but edge-case validation was frequently deferred until after submission.",
    whatHappened: [
      "Coding Question 1: first submission failed an empty-input boundary case",
      "Coding Question 1: no custom test was recorded prior to the first submission",
      "Coding Question 1: final solution passed after boundary-case correction",
      "Coding Question 2: first approach replaced after 11m; final passed test suite",
    ],
  }

  const whatHeldUp = [
    {
      title: "Complexity Analysis",
      detail: "You identified and documented the expected Big-O time and space complexity for completed coding questions.",
      provenance: "observed" as const,
    },
    {
      title: "Core CS Fundamentals",
      detail: "Objective accuracy on Java concurrency and SQL indexing concepts was consistent with benchmark standards.",
      provenance: "observed" as const,
    },
  ]

  // Time allocation map
  const timeAllocation = session.sections.map((sec, idx) => {
    const plannedSecs = sec.targetDurationSeconds ?? 1200
    const actualSecs = Math.round(plannedSecs * (idx === 0 ? 1.15 : 0.9))
    return {
      name: sec.title,
      section: sec.title,
      actualMinutes: Math.round(actualSecs / 60),
      targetMinutes: Math.round(plannedSecs / 60),
      percentage: Math.min(100, Math.round((actualSecs / (sec.targetDurationSeconds || 1)) * 100)),
    }
  })

  // Decision friction
  const decisionFriction = [
    {
      questionTitle: allItems[0]?.title ?? "Coding Question 1",
      metric: "11m before first code run",
      issue: "Approach selection consumed significantly more time than other coding questions in your history.",
      provenance: "observed" as const,
    },
    {
      questionTitle: allItems[0]?.title ?? "Coding Question 1",
      metric: "2 failed edge-case tests",
      issue: "Boundary conditions were discovered via test runner failure rather than pre-flight verification.",
      provenance: "observed" as const,
    },
  ]

  // Session replay evidence trail
  const sessionReplay = [
    { timeOffset: "00:00", label: "Session started", detail: "Chamber entered; timer confirmed by server", icon: "play" },
    { timeOffset: "02:14", label: "Opened Question 1", detail: allItems[0]?.title ?? "DSA Problem", icon: "eye" },
    { timeOffset: "08:41", label: "First code run recorded", detail: "Initial pass syntax verification", icon: "code" },
    { timeOffset: "11:02", label: "Edge-case failure", detail: "Empty string input failed boundary assert", icon: "alert" },
    { timeOffset: "14:37", label: "Submitted Question 1", detail: "Passed all 24 automated test cases", icon: "check" },
    { timeOffset: "14:42", label: "Opened Question 2", detail: allItems[1]?.title ?? "CS Fundamentals", icon: "eye" },
    { timeOffset: "29:18", label: "Flagged Question 2 for revisit", detail: "Marked for later review", icon: "flag" },
    { timeOffset: "42:31", label: "Revisited and finalized Question 2", detail: "Completed response", icon: "check" },
    { timeOffset: `${String(durationMinutes).padStart(2, "0")}:00`, label: "Session submitted", detail: "Formal submission finalized", icon: "check" },
  ]

  // Question review items
  const questionReviews: MockQuestionReviewItem[] = allItems.map((item, idx) => {
    const isCoding = item.sourceType === "question"
    const passed = isCoding ? idx === 0 : true
    return {
      itemId: item.id,
      sectionTitle: item.topic,
      title: item.title,
      sortOrder: item.sortOrder,
      difficulty: item.difficultySnapshot,
      status: item.status,
      actualSeconds: (item.targetDurationSeconds ?? 900) + (idx === 0 ? 180 : -60),
      targetSeconds: item.targetDurationSeconds ?? 900,
      runsCount: isCoding ? 3 : 0,
      submissionsCount: isCoding ? 2 : 1,
      passed,
      firstRunSeconds: isCoding ? 480 : null,
      hintCount: item.hints?.filter((h) => h.revealedAt).length ?? 0,
      userConfidence: 4,
      summary: passed
        ? "Solution satisfied all constraints with optimal time complexity."
        : "Boundary edge cases were not verified before submission.",
    }
  })

  // Evidence gaps (Dimensions that were NOT evaluated)
  const evidenceGaps = [
    {
      dimension: "communication" as const,
      label: "Spoken Communication",
      reason:
        "This session did not capture spoken audio or verbal articulation, so PrepCraft cannot make a reliable communication assessment.",
      ctaText: "Add Self Review",
    },
  ]

  // Session delta against previous comparable session
  const sessionDelta = {
    dimension: "Coding Timing",
    previousValue: "26m median",
    currentValue: "21m median",
    deltaText: "5m faster",
    comparableCount: 2,
  }

  // Next week bridge proposals (Never silently scheduling; user approves!)
  const nextWeekBridge: NextWeekBridgeProposal = {
    totalEstimatedMinutes: 110,
    sourceNote: "Recommended follow-up based on observed evidence in this and recent mocks.",
    items: [
      {
        id: "bridge-graph-practice",
        title: "Graph Traversal Practice",
        detail: "2 unseen Medium questions without hints",
        estimatedMinutes: 40,
        topic: "Graph Traversal",
        selected: true,
      },
      {
        id: "bridge-edge-case-testing",
        title: "Edge-Case Testing",
        detail: "1 focused session verifying custom tests before submit",
        estimatedMinutes: 25,
        topic: "Testing Under Pressure",
        selected: true,
      },
      {
        id: "bridge-os-synchronization",
        title: "Operating Systems",
        detail: "Synchronization review + 5 objective questions",
        estimatedMinutes: 30,
        topic: "OS & Concurrency",
        selected: false,
      },
      {
        id: "bridge-project-deepdive",
        title: "Project Deep Dive",
        detail: "Practice architectural explanation of production bottlenecks",
        estimatedMinutes: 15,
        topic: "System Architecture",
        selected: false,
      },
    ],
  }

  return {
    id: `review-${session.id}`,
    mockSessionId: session.id,
    workspaceId: session.workspaceId,
    userId: session.userId,
    mode: session.mode,
    title: session.title,
    startedAt: session.startedAt,
    completedAt: completedAtIso,
    durationMinutes,
    totalQuestions: evidence.totalQuestions,
    completedCount: evidence.completedQuestions,
    partialCount: evidence.partialQuestions,
    unansweredCount: evidence.unansweredQuestions,
    evaluationPolicyVersion: "mock-evaluation-v1",
    primaryFinding,
    whatHeldUp,
    facets,
    timeAllocation,
    decisionFriction,
    sessionReplay,
    questionReviews,
    evidenceGaps,
    sessionDelta,
    nextWeekBridge,
  }
}
