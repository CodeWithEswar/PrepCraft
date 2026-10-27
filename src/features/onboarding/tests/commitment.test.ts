// @vitest-environment node
import { describe, expect, it } from "vitest"
import {
  ALL_STUDY_DAYS,
  COMMITMENT_PRESETS,
  calculateWeeklyMinutes,
  formatMinutesToHours,
  getDayDisplayName,
  getDayShortName,
} from "../services/commitment"

describe("Commitment Calculator & Presets", () => {
  it("calculates weekly minutes from study days and daily session length", () => {
    expect(calculateWeeklyMinutes(5, 120)).toBe(600) // 5 days * 2 hours = 10 hours
    expect(calculateWeeklyMinutes(3, 90)).toBe(270) // 3 days * 1.5 hours = 4.5 hours
    expect(calculateWeeklyMinutes(7, 180)).toBe(1260) // 7 days * 3 hours = 21 hours
    expect(calculateWeeklyMinutes(0, 120)).toBe(0)
  })

  it("formats integer minutes to clean human-readable hours", () => {
    expect(formatMinutesToHours(60)).toBe("1 hr")
    expect(formatMinutesToHours(90)).toBe("1h 30m")
    expect(formatMinutesToHours(120)).toBe("2 hrs")
    expect(formatMinutesToHours(45)).toBe("45 min")
    expect(formatMinutesToHours(600)).toBe("10 hrs")
  })

  it("contains calibrated commitment presets", () => {
    expect(COMMITMENT_PRESETS.light.weeklyMinutes).toBe(300) // 5h
    expect(COMMITMENT_PRESETS.balanced.weeklyMinutes).toBe(600) // 10h
    expect(COMMITMENT_PRESETS.focused.weeklyMinutes).toBe(900) // 15h
    expect(COMMITMENT_PRESETS.intensive.weeklyMinutes).toBe(1200) // 20h
  })

  it("formats study days correctly for accessibility and compact views", () => {
    expect(ALL_STUDY_DAYS).toHaveLength(7)
    expect(getDayDisplayName("monday")).toBe("Monday")
    expect(getDayDisplayName("sunday")).toBe("Sunday")
    expect(getDayShortName("monday")).toBe("M")
    expect(getDayShortName("wednesday")).toBe("W")
  })
})
