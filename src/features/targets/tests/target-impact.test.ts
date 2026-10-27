import { describe, it, expect } from "vitest"
import { addDays, format } from "date-fns"
import { calculateTargetChangeImpact } from "../services/target-impact-service"

describe("calculateTargetChangeImpact", () => {
  const today = new Date()
  const sixtyDaysOut = format(addDays(today, 60), "yyyy-MM-dd")
  const twentyDaysOut = format(addDays(today, 20), "yyyy-MM-dd")
  const ninetyDaysOut = format(addDays(today, 90), "yyyy-MM-dd")

  it("calculates accurate days and weeks remaining for a target date", () => {
    const impact = calculateTargetChangeImpact({
      targetDate: sixtyDaysOut,
      weeklyTargetMinutes: 600,
      studyDaysCount: 5,
    })

    expect(impact.daysRemaining).toBeGreaterThanOrEqual(59)
    expect(impact.daysRemaining).toBeLessThanOrEqual(61)
    expect(impact.weeksRemaining).toBeGreaterThanOrEqual(8)
    expect(impact.isTightDeadline).toBe(false)
    expect(impact.weeklyTargetHours).toBe("10")
    expect(impact.calculatedDailyMinutes).toBe(120)
    expect(impact.requiresPlanRebalance).toBe(false)
  })

  it("flags tight deadlines under 30 days", () => {
    const impact = calculateTargetChangeImpact({
      targetDate: twentyDaysOut,
      weeklyTargetMinutes: 600,
      studyDaysCount: 5,
    })

    expect(impact.isTightDeadline).toBe(true)
    expect(impact.daysRemaining).toBeLessThan(30)
  })

  it("detects planning pressure when target date is brought forward", () => {
    const impact = calculateTargetChangeImpact({
      targetDate: twentyDaysOut,
      oldTargetDate: ninetyDaysOut,
      weeklyTargetMinutes: 600,
      studyDaysCount: 5,
    })

    expect(impact.requiresPlanRebalance).toBe(true)
    expect(impact.advisoryMessage).toContain("tightens your preparation window")
    expect(impact.advisoryMessage).toContain("Existing completed work remains preserved")
  })

  it("detects extended preparation window when target date is pushed out", () => {
    const impact = calculateTargetChangeImpact({
      targetDate: ninetyDaysOut,
      oldTargetDate: twentyDaysOut,
      weeklyTargetMinutes: 600,
      studyDaysCount: 5,
    })

    expect(impact.requiresPlanRebalance).toBe(true)
    expect(impact.advisoryMessage).toContain("Extending your target date provides")
  })

  it("handles open-ended horizon with no target date", () => {
    const impact = calculateTargetChangeImpact({
      targetDate: null,
      weeklyTargetMinutes: 450,
      studyDaysCount: 3,
    })

    expect(impact.daysRemaining).toBeNull()
    expect(impact.weeksRemaining).toBeNull()
    expect(impact.isTightDeadline).toBe(false)
    expect(impact.weeklyTargetHours).toBe("7.5")
    expect(impact.calculatedDailyMinutes).toBe(150)
    expect(impact.advisoryMessage).toContain("open-ended horizon")
  })
})
