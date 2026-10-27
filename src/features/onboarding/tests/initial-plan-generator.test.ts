// @vitest-environment node
import { describe, expect, it } from "vitest"
import { generateInitialPlan } from "../services/initial-plan-generator"

describe("Initial Plan Generator Service", () => {
  it("generates deterministic first-week plan for Amazon SDE in Java with 10h commitment", () => {
    const plan = generateInitialPlan({
      templateId: "amazon-sde",
      weeklyTargetMinutes: 600,
      studyDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      defaultDailyMinutes: 120,
      preferredCodingLanguage: "java",
    })

    expect(plan.templateId).toBe("amazon-sde")
    expect(plan.totalWeeklyMinutes).toBe(600)
    expect(plan.plannedSessions).toBe(5)
    expect(plan.firstWeekPlan).toHaveLength(5)
    expect(plan.focusAreas[0]).toBe("Java Foundations")
    expect(plan.starterItems).toHaveLength(3)

    // Verify session minutes add up accurately
    const totalAllocated = plan.firstWeekPlan.reduce((acc, s) => acc + s.allocatedMinutes, 0)
    expect(totalAllocated).toBe(600)
  })

  it("handles non-standard study days and languages gracefully", () => {
    const plan = generateInitialPlan({
      templateId: "frontend-engineer",
      weeklyTargetMinutes: 300,
      studyDays: ["saturday", "sunday"],
      defaultDailyMinutes: 150,
      preferredCodingLanguage: "javascript",
    })

    expect(plan.templateId).toBe("frontend-engineer")
    expect(plan.totalWeeklyMinutes).toBe(300)
    expect(plan.plannedSessions).toBe(2)
    expect(plan.firstWeekPlan).toHaveLength(2)
    expect(plan.focusAreas[0]).toBe("JavaScript/TypeScript Foundations")

    const totalAllocated = plan.firstWeekPlan.reduce((acc, s) => acc + s.allocatedMinutes, 0)
    expect(totalAllocated).toBe(300)
  })

  it("calculates percentage focus breakdown correctly", () => {
    const plan = generateInitialPlan({
      templateId: "general-swe",
      weeklyTargetMinutes: 600,
      studyDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      defaultDailyMinutes: 120,
      preferredCodingLanguage: "python",
    })

    expect(plan.focusBreakdown.length).toBeGreaterThan(0)
    const sumPercentage = plan.focusBreakdown.reduce((acc, b) => acc + b.percentage, 0)
    // Check that breakdown percentage is approximately 100% (within rounding)
    expect(sumPercentage).toBeGreaterThanOrEqual(95)
    expect(sumPercentage).toBeLessThanOrEqual(105)
  })
})
