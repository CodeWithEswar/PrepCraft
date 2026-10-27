import type { NextWeekBridgeItem } from "../types/mock.types"

export interface ProposedPlanningTask {
  title: string
  notes: string
  estimatedMinutes: number
  taskType: "dsa_practice" | "cs_fundamentals" | "behavioral" | "project"
  source: string
}

export function buildPlanningProposalFromBridge(
  selectedItems: NextWeekBridgeItem[]
): ProposedPlanningTask[] {
  return selectedItems.map((item) => {
    let taskType: ProposedPlanningTask["taskType"] = "dsa_practice"
    if (item.topic.toLowerCase().includes("os") || item.topic.toLowerCase().includes("concurrency")) {
      taskType = "cs_fundamentals"
    } else if (item.topic.toLowerCase().includes("architecture") || item.topic.toLowerCase().includes("project")) {
      taskType = "project"
    } else if (item.topic.toLowerCase().includes("behavioral") || item.topic.toLowerCase().includes("leadership")) {
      taskType = "behavioral"
    }

    return {
      title: item.title,
      notes: `${item.detail}. Proposed following mock interview evidence.`,
      estimatedMinutes: item.estimatedMinutes,
      taskType,
      source: "mock_interview_bridge",
    }
  })
}
