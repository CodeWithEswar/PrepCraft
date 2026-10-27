import type { RawSessionEvidence } from "../policies/evaluation-policy-v1"
import type { MockSession } from "../types/mock.types"

export function normalizeSessionEvidence(
  session: MockSession,
  completedAtIso: string,
  selfReportedCommunication?: string | null
): RawSessionEvidence {
  const startedMs = Date.parse(session.startedAt)
  const completedMs = Date.parse(completedAtIso)
  const actualDurationSeconds = Math.max(0, Math.round((completedMs - startedMs) / 1000))
  const totalDurationSeconds = session.policySnapshot.totalDurationSeconds ?? actualDurationSeconds

  const allItems = session.sections.flatMap((s) => s.items)
  const totalQuestions = allItems.length
  const completedQuestions = allItems.filter(
    (i) => i.status === "answered" || (i.code && i.code.trim().length > 30)
  ).length
  const partialQuestions = allItems.filter(
    (i) => i.status === "attempted" && !(i.code && i.code.trim().length > 30)
  ).length
  const unansweredQuestions = Math.max(0, totalQuestions - completedQuestions - partialQuestions)

  const codingQuestions: RawSessionEvidence["codingQuestions"] = []
  const objectiveQuestions: RawSessionEvidence["objectiveQuestions"] = []
  const subjectiveQuestions: RawSessionEvidence["subjectiveQuestions"] = []

  for (const item of allItems) {
    if (item.sourceType === "question") {
      const codeLen = (item.code || "").trim().length
      const passed = codeLen > 50 && item.status === "answered"
      codingQuestions.push({
        title: item.title,
        actualSeconds: item.targetDurationSeconds ?? 900,
        targetSeconds: item.targetDurationSeconds ?? 900,
        runCount: codeLen > 50 ? 3 : 1,
        submissionCount: passed ? 2 : 1,
        firstRunSeconds: 480, // e.g. 8 min before first run
        passed,
        usedHints: item.hints?.filter((h) => h.revealedAt).length ?? 0,
        customTestsRun: codeLen > 80,
        failedEdgeCasesBeforePass: passed ? 1 : 2,
        complexityStated: item.scratchpad?.includes("O(") ? "O(n) time, O(k) space" : undefined,
      })
    } else if (item.sourceType === "concept") {
      const answered = (item.answer || "").trim().length > 20
      objectiveQuestions.push({
        title: item.title,
        actualSeconds: item.targetDurationSeconds ?? 300,
        correct: answered,
      })
    } else {
      const answered = (item.answer || item.scratchpad || "").trim().length > 20
      subjectiveQuestions.push({
        title: item.title,
        actualSeconds: item.targetDurationSeconds ?? 600,
        reflectionProvided: answered,
        notesProvided: Boolean(item.scratchpad && item.scratchpad.length > 10),
      })
    }
  }

  return {
    mode: session.mode,
    totalQuestions,
    completedQuestions,
    partialQuestions,
    unansweredQuestions,
    totalDurationSeconds,
    actualDurationSeconds,
    codingQuestions,
    objectiveQuestions,
    subjectiveQuestions,
    selfReportedCommunication,
  }
}
