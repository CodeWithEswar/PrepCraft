import { differenceInDays, differenceInWeeks, parseISO } from "date-fns"
import type { TargetChangeImpact } from "../types/target.types"

/**
 * Computes change impact preview when editing target date or schedule preferences.
 * Previews decision consequences without fabricating unverified analytics.
 */
export function calculateTargetChangeImpact(params: {
  targetDate?: string | null
  oldTargetDate?: string | null
  weeklyTargetMinutes: number
  studyDaysCount: number
}): TargetChangeImpact {
  const { targetDate, oldTargetDate, weeklyTargetMinutes, studyDaysCount } = params

  let daysRemaining: number | null = null
  let weeksRemaining: number | null = null
  let isTightDeadline = false

  if (targetDate) {
    const targetParsed = parseISO(targetDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (!isNaN(targetParsed.getTime())) {
      daysRemaining = Math.max(0, differenceInDays(targetParsed, today))
      weeksRemaining = Math.max(0, differenceInWeeks(targetParsed, today))
      isTightDeadline = daysRemaining < 30
    }
  }

  const validDays = Math.max(1, studyDaysCount)
  const calculatedDailyMinutes = Math.round(weeklyTargetMinutes / validDays)
  const weeklyTargetHours = (weeklyTargetMinutes / 60).toFixed(1).replace(/\.0$/, "")

  let requiresPlanRebalance = false
  let advisoryMessage = "Your configuration is balanced and sustainable."

  if (targetDate && oldTargetDate && targetDate !== oldTargetDate) {
    requiresPlanRebalance = true
    const oldParsed = parseISO(oldTargetDate)
    const newParsed = parseISO(targetDate)

    if (newParsed < oldParsed) {
      advisoryMessage = `Moving your target date forward tightens your preparation window to ${daysRemaining} days. Existing completed work remains preserved; future milestones will be rebalanced.`
    } else {
      advisoryMessage = `Extending your target date provides ${weeksRemaining} weeks of preparation time. Future sessions can be distributed at a more sustainable pace.`
    }
  } else if (!targetDate) {
    advisoryMessage = "You are preparing on an open-ended horizon. Tasks will be calibrated to your weekly commitment without a hard countdown."
  }

  return {
    daysRemaining,
    weeksRemaining,
    isTightDeadline,
    weeklyTargetHours,
    studyDaysCount: validDays,
    calculatedDailyMinutes,
    requiresPlanRebalance,
    advisoryMessage,
  }
}
