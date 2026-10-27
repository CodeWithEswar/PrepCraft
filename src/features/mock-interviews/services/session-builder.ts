import type {
  MockMode,
  MockSectionType,
  MockSession,
  MockSessionSection,
  SessionBlueprint,
  SimulationPolicy,
} from "../types/mock.types"
import { getMockPolicy } from "../policies/mock-policy-v1"
import { getOAPolicy } from "../policies/oa-policy-v1"
import { selectQuestionsForSection } from "./question-selector"

export interface CreateMockSessionInput {
  workspaceId: string
  userId: string
  blueprint?: SessionBlueprint
  customConfig?: {
    title: string
    mode: MockMode
    durationMinutes: number
    difficulty: "easy" | "medium" | "hard" | "mixed"
    sections: {
      type: MockSectionType
      title: string
      count: number
      durationMinutes: number
    }[]
    pausePolicy: "allowed" | "restricted" | "forbidden"
    navigationPolicy: "free" | "sequential" | "locked"
    hints: boolean
    scratchpad: boolean
    autoSubmit: boolean
  }
}

export function buildMockSession(input: CreateMockSessionInput): MockSession {
  const sessionId = `mock-${crypto.randomUUID()}`
  const execSessionId = `exec-${crypto.randomUUID()}`
  const now = new Date()
  const startedAt = now.toISOString()

  let mode: MockMode = "mixed"
  let title = "Mixed Technical Mock"
  let durationMinutes = 45
  let policy: SimulationPolicy
  let sectionsConfig: { type: MockSectionType; title: string; count: number; durationMinutes: number }[] = []
  let blueprintId: string | null = null
  let blueprintVersion = 1

  if (input.blueprint) {
    blueprintId = input.blueprint.id
    blueprintVersion = input.blueprint.version
    mode = input.blueprint.mode
    title = input.blueprint.name
    durationMinutes = input.blueprint.durationMinutes
    policy = { ...input.blueprint.policySnapshot }
    sectionsConfig = input.blueprint.sectionsConfig
  } else if (input.customConfig) {
    mode = input.customConfig.mode
    title = input.customConfig.title
    durationMinutes = input.customConfig.durationMinutes
    const basePolicy =
      mode === "oa"
        ? getOAPolicy(durationMinutes)
        : getMockPolicy(mode, durationMinutes)

    policy = {
      ...basePolicy,
      pausePolicy: input.customConfig.pausePolicy,
      navigationPolicy: input.customConfig.navigationPolicy,
      hintPolicy: input.customConfig.hints ? "limited" : "forbidden",
      allowScratchpad: input.customConfig.scratchpad,
      autoSubmit: input.customConfig.autoSubmit,
    }
    sectionsConfig = input.customConfig.sections
  } else {
    mode = "mixed"
    title = "Mixed Technical Mock"
    durationMinutes = 60
    policy = getMockPolicy("mixed", 60)
    sectionsConfig = [
      { type: "coding", title: "Coding (DSA)", count: 2, durationMinutes: 25 },
      { type: "cs_fundamentals", title: "CS Fundamentals", count: 3, durationMinutes: 20 },
      { type: "project_deep_dive", title: "Project Deep Dive", count: 1, durationMinutes: 15 },
    ]
  }

  const durationSeconds = durationMinutes * 60
  const expiresAt = new Date(now.getTime() + durationSeconds * 1000).toISOString()

  // Assemble sections and items
  let sortOrder = 0
  const sections: MockSessionSection[] = []

  for (let sIdx = 0; sIdx < sectionsConfig.length; sIdx++) {
    const sConf = sectionsConfig[sIdx]
    const sectionId = `sec-${sessionId}-${sIdx + 1}`
    const items = selectQuestionsForSection(sConf, sectionId, sortOrder)
    sortOrder += items.length

    // If first item of first section, mark as viewed
    if (sIdx === 0 && items.length > 0) {
      items[0].status = "viewed"
      items[0].firstViewedAt = startedAt
    }

    sections.push({
      id: sectionId,
      mockSessionId: sessionId,
      sectionType: sConf.type,
      title: sConf.title,
      sortOrder: sIdx,
      targetDurationSeconds: sConf.durationMinutes * 60,
      items,
    })
  }

  return {
    id: sessionId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    executionSessionId: execSessionId,
    blueprintId,
    blueprintVersion,
    mode,
    title,
    status: "active",
    targetRoleId: "Software Development Engineer",
    targetCompanyId: "Amazon",
    policySnapshot: policy,
    selectionPolicyVersion: "selection-policy-v1",
    evaluationPolicyVersion: "mock-evaluation-v1",
    startedAt,
    submittedAt: null,
    completedAt: null,
    expiresAt,
    sections,
  }
}
