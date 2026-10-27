import type { MockMode, SimulationPolicy } from "../types/mock.types"

export const MOCK_POLICY_V1 = "mock-policy-v1"

export function getMockPolicy(mode: MockMode, durationMinutes?: number): SimulationPolicy {
  const durationSeconds = (durationMinutes ?? 45) * 60

  switch (mode) {
    case "coding":
      return {
        mode,
        totalDurationSeconds: durationSeconds,
        pausePolicy: "restricted",
        navigationPolicy: "free",
        hintPolicy: "limited",
        answerChangePolicy: "allowed",
        autoSubmit: false,
        questionTimerPolicy: "target",
        showProgress: true,
        showQuestionStatus: true,
        allowFlagging: true,
        allowScratchpad: true,
        allowCodeExecution: true,
        reviewPolicyVersion: "mock-evaluation-v1",
      }

    case "cs_fundamentals":
      return {
        mode,
        totalDurationSeconds: durationSeconds,
        pausePolicy: "allowed",
        navigationPolicy: "free",
        hintPolicy: "forbidden",
        answerChangePolicy: "allowed",
        autoSubmit: false,
        questionTimerPolicy: "target",
        showProgress: true,
        showQuestionStatus: true,
        allowFlagging: true,
        allowScratchpad: false,
        allowCodeExecution: false,
        reviewPolicyVersion: "mock-evaluation-v1",
      }

    case "behavioral":
      return {
        mode,
        totalDurationSeconds: durationSeconds,
        pausePolicy: "restricted",
        navigationPolicy: "sequential",
        hintPolicy: "limited",
        answerChangePolicy: "allowed",
        autoSubmit: false,
        questionTimerPolicy: "target",
        showProgress: true,
        showQuestionStatus: true,
        allowFlagging: true,
        allowScratchpad: true,
        allowCodeExecution: false,
        reviewPolicyVersion: "mock-evaluation-v1",
      }

    case "project_deep_dive":
      return {
        mode,
        totalDurationSeconds: durationSeconds,
        pausePolicy: "allowed",
        navigationPolicy: "free",
        hintPolicy: "forbidden",
        answerChangePolicy: "allowed",
        autoSubmit: false,
        questionTimerPolicy: "target",
        showProgress: true,
        showQuestionStatus: true,
        allowFlagging: true,
        allowScratchpad: true,
        allowCodeExecution: false,
        reviewPolicyVersion: "mock-evaluation-v1",
      }

    case "oa":
      return {
        mode,
        totalDurationSeconds: durationSeconds,
        pausePolicy: "forbidden",
        navigationPolicy: "free",
        hintPolicy: "forbidden",
        answerChangePolicy: "allowed",
        autoSubmit: true,
        questionTimerPolicy: "hard_limit",
        showProgress: true,
        showQuestionStatus: true,
        allowFlagging: true,
        allowScratchpad: true,
        allowCodeExecution: true,
        reviewPolicyVersion: "mock-evaluation-v1",
      }

    case "mixed":
    case "custom":
    default:
      return {
        mode,
        totalDurationSeconds: durationSeconds,
        pausePolicy: "forbidden",
        navigationPolicy: "free",
        hintPolicy: "forbidden",
        answerChangePolicy: "allowed",
        autoSubmit: true,
        questionTimerPolicy: "target",
        showProgress: true,
        showQuestionStatus: true,
        allowFlagging: true,
        allowScratchpad: true,
        allowCodeExecution: true,
        reviewPolicyVersion: "mock-evaluation-v1",
      }
  }
}
