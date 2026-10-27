import type {
  EvidenceConfidence,
  EvidenceProvenance,
  FacetFinding,
  PerformanceDimension,
} from "../types/mock.types"

export const EVALUATION_POLICY_V1 = "mock-evaluation-v1"

export interface RawSessionEvidence {
  mode: string
  totalQuestions: number
  completedQuestions: number
  partialQuestions: number
  unansweredQuestions: number
  totalDurationSeconds: number
  actualDurationSeconds: number
  codingQuestions: {
    title: string
    actualSeconds: number
    targetSeconds: number | null
    runCount: number
    submissionCount: number
    firstRunSeconds: number | null
    passed: boolean
    usedHints: number
    customTestsRun: boolean
    failedEdgeCasesBeforePass: number
    complexityStated?: string
    userConfidence?: number | null
  }[]
  objectiveQuestions: {
    title: string
    actualSeconds: number
    correct: boolean
    userConfidence?: number | null
  }[]
  subjectiveQuestions: {
    title: string
    actualSeconds: number
    reflectionProvided: boolean
    notesProvided: boolean
    userConfidence?: number | null
  }[]
  selfReportedCommunication?: string | null
}

export function evaluateSessionFacets(
  evidence: RawSessionEvidence
): Record<PerformanceDimension, FacetFinding> {
  // 1. Problem Solving
  const totalSolved =
    evidence.codingQuestions.filter((q) => q.passed).length +
    evidence.objectiveQuestions.filter((q) => q.correct).length
  const totalEvaluated = evidence.codingQuestions.length + evidence.objectiveQuestions.length
  const ratio = totalEvaluated > 0 ? totalSolved / totalEvaluated : 0

  const problemSolving: FacetFinding = {
    dimension: "problem_solving",
    title: "Problem Solving",
    statusText: ratio >= 0.75 ? "Stable evidence" : ratio >= 0.5 ? "Developing" : "Needs attention",
    status: ratio >= 0.75 ? "stable" : ratio >= 0.5 ? "developing" : "needs_attention",
    confidence: totalEvaluated >= 3 ? "strong" : totalEvaluated > 0 ? "moderate" : "insufficient",
    provenance: "observed",
    summary:
      totalEvaluated > 0
        ? `Solved ${totalSolved} of ${totalEvaluated} evaluated technical questions.`
        : "No technical problem solving questions in this session.",
    evidencePoints: [
      `Completed ${evidence.completedQuestions} of ${evidence.totalQuestions} total questions`,
      evidence.codingQuestions.some((q) => q.usedHints > 0)
        ? "Required hints on at least one problem"
        : "No hints used during problem solving",
    ],
  }

  // 2. Correctness
  const correctness: FacetFinding = {
    dimension: "correctness",
    title: "Correctness",
    statusText: ratio >= 0.8 ? "Strong" : ratio >= 0.6 ? "Developing" : "Needs attention",
    status: ratio >= 0.8 ? "strong" : ratio >= 0.6 ? "developing" : "needs_attention",
    confidence: totalEvaluated >= 2 ? "strong" : "limited",
    provenance: "observed",
    summary:
      totalEvaluated > 0
        ? `${Math.round(ratio * 100)}% objective accuracy on evaluated test suites and questions.`
        : "No objective verification suites executed.",
    evidencePoints: evidence.codingQuestions.map(
      (q) => `${q.title}: ${q.passed ? "Passed all tests" : "Incomplete or failed test cases"}`
    ),
  }

  // 3. Complexity
  const statedComplexityCount = evidence.codingQuestions.filter((q) => q.complexityStated).length
  const complexity: FacetFinding = {
    dimension: "complexity",
    title: "Complexity",
    statusText: statedComplexityCount > 0 ? "Strong" : "Not evaluated",
    status: statedComplexityCount > 0 ? "strong" : "not_evaluated",
    confidence: statedComplexityCount > 0 ? "moderate" : "insufficient",
    provenance: statedComplexityCount > 0 ? "observed" : "rule_derived",
    summary:
      statedComplexityCount > 0
        ? "Identified expected Big-O time and space complexity."
        : "Complexity analysis was not explicitly captured in this session.",
    evidencePoints:
      statedComplexityCount > 0
        ? [`Recorded complexity on ${statedComplexityCount} coding questions`]
        : ["No complexity response captured"],
    notEvaluatedReason:
      statedComplexityCount === 0
        ? "This session did not require or record Big-O complexity notes."
        : undefined,
  }

  // 4. Communication (CRITICAL TRUST: never claim voice was observed)
  const communication: FacetFinding = {
    dimension: "communication",
    title: "Communication",
    statusText: evidence.selfReportedCommunication ? "Self-reported only" : "Not evaluated",
    status: evidence.selfReportedCommunication ? "stable" : "not_evaluated",
    confidence: evidence.selfReportedCommunication ? "moderate" : "insufficient",
    provenance: evidence.selfReportedCommunication ? "self_reported" : "rule_derived",
    summary: evidence.selfReportedCommunication
      ? `User note: "${evidence.selfReportedCommunication}"`
      : "This session did not capture spoken communication, so PrepCraft cannot make a reliable communication assessment.",
    evidencePoints: evidence.selfReportedCommunication
      ? ["Self-reported reflection entered after session"]
      : [
          "Spoken audio/interview articulation was not observed.",
          "Add a self-review if you want this session to record communication reflections.",
        ],
    notEvaluatedReason: !evidence.selfReportedCommunication
      ? "PrepCraft simulates conditions without pretending to hear speech that was not recorded."
      : undefined,
  }

  // 5. Testing
  const deferredEdgeCases = evidence.codingQuestions.filter((q) => q.failedEdgeCasesBeforePass > 0).length
  const testingStatus = deferredEdgeCases > 0 ? "needs_attention" : "developing"
  const testing: FacetFinding = {
    dimension: "testing",
    title: "Testing",
    statusText: deferredEdgeCases > 0 ? "Needs attention" : "Developing",
    status: testingStatus,
    confidence: evidence.codingQuestions.length > 0 ? "strong" : "limited",
    provenance: "observed",
    summary:
      deferredEdgeCases > 0
        ? "Edge cases were frequently discovered after submission rather than through pre-submission tests."
        : "Testing sequence was completed before submitting code.",
    evidencePoints: [
      `${deferredEdgeCases} submission(s) encountered failed edge cases before passing`,
      evidence.codingQuestions.some((q) => q.customTestsRun)
        ? "Custom test cases were executed before submission"
        : "No custom test verification was recorded prior to first submission",
    ],
  }

  // 6. Speed
  const overTargetCount = evidence.codingQuestions.filter(
    (q) => q.targetSeconds && q.actualSeconds > q.targetSeconds
  ).length
  const speed: FacetFinding = {
    dimension: "speed",
    title: "Speed",
    statusText: overTargetCount > 0 ? "Developing" : "Stable evidence",
    status: overTargetCount > 0 ? "developing" : "stable",
    confidence: "strong",
    provenance: "observed",
    summary:
      overTargetCount > 0
        ? `${overTargetCount} question(s) exceeded target allocation under time pressure.`
        : "Maintained pace within target question durations.",
    evidencePoints: [
      `Total session time: ${Math.round(evidence.actualDurationSeconds / 60)} min vs ${Math.round(evidence.totalDurationSeconds / 60)} min planned`,
      ...evidence.codingQuestions.map(
        (q) =>
          `${q.title}: ${Math.round(q.actualSeconds / 60)}m (${q.targetSeconds ? `target ${Math.round(q.targetSeconds / 60)}m` : "no target"})`
      ),
    ],
  }

  // 7. Confidence Calibration
  const confidences = [
    ...evidence.codingQuestions.map((q) => ({ conf: q.userConfidence, passed: q.passed })),
    ...evidence.objectiveQuestions.map((q) => ({ conf: q.userConfidence, passed: q.correct })),
  ].filter((item) => typeof item.conf === "number")

  const overConfident = confidences.filter((c) => (c.conf ?? 0) >= 4 && !c.passed).length
  const confidence: FacetFinding = {
    dimension: "confidence",
    title: "Confidence Calibration",
    statusText:
      overConfident > 0
        ? `Overestimated on ${overConfident} question${overConfident > 1 ? "s" : ""}`
        : confidences.length > 0
        ? "Calibrated"
        : "No Recent Evidence",
    status:
      overConfident > 0 ? "overestimated" : confidences.length > 0 ? "strong" : "no_recent_evidence",
    confidence: confidences.length > 0 ? "moderate" : "insufficient",
    provenance: "automated_analysis",
    summary:
      overConfident > 0
        ? `High self-rated confidence (4-5) conflicted with objective test outcomes on ${overConfident} question(s).`
        : confidences.length > 0
        ? "Self-reported confidence aligned closely with question outcomes."
        : "Confidence ratings were not provided for questions in this session.",
    evidencePoints:
      confidences.length > 0
        ? [`Recorded confidence ratings on ${confidences.length} questions`]
        : ["No confidence data captured during session"],
  }

  return {
    problem_solving: problemSolving,
    correctness,
    complexity,
    communication,
    testing,
    speed,
    confidence,
  }
}
