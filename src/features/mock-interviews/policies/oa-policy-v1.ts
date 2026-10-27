import type { SimulationPolicy } from "../types/mock.types"

export const OA_POLICY_V1 = "oa-policy-v1"

export function getOAPolicy(durationMinutes = 60): SimulationPolicy {
  return {
    mode: "oa",
    totalDurationSeconds: durationMinutes * 60,
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
}
