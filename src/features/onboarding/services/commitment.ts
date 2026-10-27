import type { CommitmentPreset, StudyDay } from "../types/onboarding.types"

export const ALL_STUDY_DAYS: readonly StudyDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

export interface PresetDefinition {
  preset: CommitmentPreset
  label: string
  hoursPerWeek: number
  weeklyMinutes: number
  defaultDailyMinutes: number
  description: string
}

export const COMMITMENT_PRESETS: Record<Exclude<CommitmentPreset, "custom">, PresetDefinition> = {
  light: {
    preset: "light",
    label: "Light",
    hoursPerWeek: 5,
    weeklyMinutes: 300,
    defaultDailyMinutes: 60,
    description: "~5 hours/week · sustainable consistency",
  },
  balanced: {
    preset: "balanced",
    label: "Balanced",
    hoursPerWeek: 10,
    weeklyMinutes: 600,
    defaultDailyMinutes: 120,
    description: "~10 hours/week · steady comprehensive prep",
  },
  focused: {
    preset: "focused",
    label: "Focused",
    hoursPerWeek: 15,
    weeklyMinutes: 900,
    defaultDailyMinutes: 180,
    description: "~15 hours/week · accelerated target timeline",
  },
  intensive: {
    preset: "intensive",
    label: "Intensive",
    hoursPerWeek: 20,
    weeklyMinutes: 1200,
    defaultDailyMinutes: 240,
    description: "20+ hours/week · full-time preparation immersion",
  },
}

export function calculateWeeklyMinutes(studyDaysCount: number, dailyMinutes: number): number {
  if (studyDaysCount <= 0) return 0
  const validDays = Math.min(7, studyDaysCount)
  const validMinutes = Math.max(15, Math.min(1440, dailyMinutes))
  return validDays * validMinutes
}

export function formatMinutesToHours(minutes: number): string {
  const hours = minutes / 60
  if (hours % 1 === 0) {
    return `${hours} hr${hours === 1 ? "" : "s"}`
  }
  const fullHours = Math.floor(hours)
  const remMinutes = minutes % 60
  if (fullHours === 0) {
    return `${remMinutes} min`
  }
  return `${fullHours}h ${remMinutes}m`
}

export function formatWeeklyMinutesDisplay(minutes: number): string {
  const hours = minutes / 60
  if (hours % 1 === 0) {
    return `${hours} hrs/week`
  }
  return `${hours.toFixed(1)} hrs/week`
}

export function formatDailyMinutesDisplay(minutes: number): string {
  return `${formatMinutesToHours(minutes)}/day`
}

export function getPresetFromWeeklyMinutes(weeklyMinutes: number): CommitmentPreset {
  if (weeklyMinutes <= 360) return "light"
  if (weeklyMinutes <= 720) return "balanced"
  if (weeklyMinutes <= 1080) return "focused"
  if (weeklyMinutes >= 1200) return "intensive"
  return "custom"
}

export function getDayDisplayName(day: StudyDay): string {
  switch (day) {
    case "monday":
      return "Monday"
    case "tuesday":
      return "Tuesday"
    case "wednesday":
      return "Wednesday"
    case "thursday":
      return "Thursday"
    case "friday":
      return "Friday"
    case "saturday":
      return "Saturday"
    case "sunday":
      return "Sunday"
  }
}

export function getDayShortName(day: StudyDay): string {
  switch (day) {
    case "monday":
      return "M"
    case "tuesday":
      return "T"
    case "wednesday":
      return "W"
    case "thursday":
      return "T"
    case "friday":
      return "F"
    case "saturday":
      return "S"
    case "sunday":
      return "S"
  }
}
