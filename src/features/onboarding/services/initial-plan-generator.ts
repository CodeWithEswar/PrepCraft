import type {
  GeneratedInitialPlan,
  StarterPlanSession,
  StudyDay,
  CodingLanguage,
} from "../types/onboarding.types"
import { CANONICAL_TEMPLATES } from "./template-recommendation"
import { getDayDisplayName } from "./commitment"

export interface PlanGenerationInput {
  templateId: string
  weeklyTargetMinutes: number
  studyDays: StudyDay[]
  defaultDailyMinutes: number
  preferredCodingLanguage: CodingLanguage
  targetDate?: string | null
}

const LANGUAGE_LABELS: Record<CodingLanguage, string> = {
  java: "Java",
  python: "Python",
  cpp: "C++",
  javascript: "JavaScript/TypeScript",
  other: "Problem Solving",
}

export function generateInitialPlan(input: PlanGenerationInput): GeneratedInitialPlan {
  const {
    templateId,
    weeklyTargetMinutes,
    studyDays,
    preferredCodingLanguage,
  } = input

  const template =
    CANONICAL_TEMPLATES.find((t) => t.id === templateId) ??
    CANONICAL_TEMPLATES.find((t) => t.id === "general-swe")!

  const langLabel = LANGUAGE_LABELS[preferredCodingLanguage] ?? "Language"
  const sessionCount = Math.max(1, studyDays.length)
  const baseSessionMinutes = Math.floor(weeklyTargetMinutes / sessionCount)
  const remainderMinutes = weeklyTargetMinutes % sessionCount

  // Focus areas from template, with the chosen coding language prioritized
  const focusAreas = [
    `${langLabel} Foundations`,
    ...template.focusAreas.filter((f) => !f.toLowerCase().includes("java")),
  ].slice(0, 5)

  // Day-by-day plan distribution
  const firstWeekPlan: StarterPlanSession[] = studyDays.map((day, idx) => {
    // Add any remainder minutes to the first session
    const allocatedMinutes = baseSessionMinutes + (idx === 0 ? remainderMinutes : 0)
    const dayLabel = getDayDisplayName(day)

    // Select primary topic for this session
    const topicIdx = idx % focusAreas.length
    const primaryFocus = focusAreas[topicIdx]

    let items: StarterPlanSession["items"] = []

    if (idx === 0) {
      // Day 1: Diagnostic & Core Syntax
      items = [
        {
          title: `${langLabel} Standard Library & Time Complexity`,
          durationMinutes: Math.round(allocatedMinutes * 0.4),
          type: "concept",
        },
        {
          title: "Warmup: Two Pointers & Sliding Window Setup",
          durationMinutes: Math.round(allocatedMinutes * 0.6),
          type: "practice",
        },
      ]
    } else if (idx === 1) {
      // Day 2: Core Data Structure
      items = [
        {
          title: "Arrays & Strings: Frequency Maps & Prefix Sums",
          durationMinutes: Math.round(allocatedMinutes * 0.7),
          type: "practice",
        },
        {
          title: "Pattern Reflection & Edge Case Analysis",
          durationMinutes: Math.round(allocatedMinutes * 0.3),
          type: "revision",
        },
      ]
    } else if (idx === 2) {
      // Day 3: Algorithmic Depth & Core CS
      items = [
        {
          title: "Hash Tables & Collision Handling Internals",
          durationMinutes: Math.round(allocatedMinutes * 0.5),
          type: "concept",
        },
        {
          title: "Medium Problem Practice: 2 Deliberate Attempts",
          durationMinutes: Math.round(allocatedMinutes * 0.5),
          type: "practice",
        },
      ]
    } else if (idx === 3) {
      // Day 4: Breadth / System / Behavioral
      items = [
        {
          title: "Binary Search & Sorting Invariants",
          durationMinutes: Math.round(allocatedMinutes * 0.6),
          type: "practice",
        },
        {
          title: "Behavioral STAR Scenario: Ownership & Trade-offs",
          durationMinutes: Math.round(allocatedMinutes * 0.4),
          type: "behavioral",
        },
      ]
    } else {
      // Day 5+: Consolidation & Revision
      items = [
        {
          title: "Consolidated Problem Solving Under 30m Timebox",
          durationMinutes: Math.round(allocatedMinutes * 0.65),
          type: "practice",
        },
        {
          title: "Spaced Repetition Review of Weak Patterns",
          durationMinutes: Math.round(allocatedMinutes * 0.35),
          type: "revision",
        },
      ]
    }

    return {
      day: dayLabel,
      title: `${primaryFocus} Session`,
      focusArea: primaryFocus,
      allocatedMinutes,
      items,
    }
  })

  // Focus breakdown summary calculation
  const breakdownMap = new Map<string, number>()
  for (const session of firstWeekPlan) {
    const current = breakdownMap.get(session.focusArea) ?? 0
    breakdownMap.set(session.focusArea, current + session.allocatedMinutes)
  }

  const focusBreakdown = Array.from(breakdownMap.entries()).map(([area, minutes]) => ({
    area,
    minutes,
    percentage: Math.round((minutes / weeklyTargetMinutes) * 100),
  }))

  // Concrete starter items for Today view hand-off
  const starterItems = [
    {
      title: `${langLabel} Collections & Performance Characteristics`,
      tag: "Core Language",
      durationMinutes: 45,
      description: "Fast review of array/list implementations, memory footprint, and sorting costs.",
    },
    {
      title: "Arrays — Two Pointers & Window Invariants",
      tag: "Data Structures",
      durationMinutes: 60,
      description: "Solve 2 targeted medium questions focusing on pointers without redundant space.",
    },
    {
      title: "Revision & First Problem Journaling",
      tag: "Reflection",
      durationMinutes: 30,
      description: "Document edge cases and what tripped you up during your deliberate attempts.",
    },
  ]

  return {
    templateId: template.id,
    totalWeeklyMinutes: weeklyTargetMinutes,
    plannedSessions: sessionCount,
    focusAreas,
    focusBreakdown,
    firstWeekPlan,
    starterItems,
  }
}
