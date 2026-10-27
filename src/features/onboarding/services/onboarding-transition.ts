import type { OnboardingStage } from "../types/onboarding.types"

export const ONBOARDING_STAGES: readonly OnboardingStage[] = [
  "welcome",
  "profile",
  "target",
  "language",
  "commitment",
  "target-date",
  "workspace",
  "ready",
] as const

const STAGE_INDEX_MAP: Record<OnboardingStage, number> = {
  welcome: 0,
  profile: 1,
  target: 2,
  language: 3,
  commitment: 4,
  "target-date": 5,
  workspace: 6,
  ready: 7,
}

export function getStageIndex(stage: OnboardingStage): number {
  return STAGE_INDEX_MAP[stage] ?? 0
}

export function getNextStage(currentStage: OnboardingStage): OnboardingStage | null {
  const currentIndex = getStageIndex(currentStage)
  if (currentIndex < ONBOARDING_STAGES.length - 1) {
    return ONBOARDING_STAGES[currentIndex + 1]
  }
  return null
}

export function getPreviousStage(currentStage: OnboardingStage): OnboardingStage | null {
  const currentIndex = getStageIndex(currentStage)
  if (currentIndex > 0) {
    return ONBOARDING_STAGES[currentIndex - 1]
  }
  return null
}

/**
 * Maps raw database onboarding_state column to canonical UI onboarding stage.
 * Handles both new canonical strings and backwards-compatible legacy names.
 */
export function mapDbStateToStage(dbState: string | null | undefined): OnboardingStage {
  if (!dbState || dbState === "not_started" || dbState === "welcome") {
    return "welcome"
  }
  switch (dbState) {
    case "profile":
      return "profile"
    case "target":
    case "career_target":
      return "target"
    case "language":
    case "coding_language":
      return "language"
    case "commitment":
    case "study_commitment":
      return "commitment"
    case "target_date":
    case "target-date":
      return "target-date"
    case "workspace":
      return "workspace"
    case "ready":
      return "ready"
    case "completed":
      return "ready"
    default:
      return "welcome"
  }
}

/**
 * Maps UI stage to database onboarding_state value.
 */
export function mapStageToDbState(stage: OnboardingStage): string {
  switch (stage) {
    case "welcome":
      return "welcome"
    case "profile":
      return "profile"
    case "target":
      return "career_target"
    case "language":
      return "coding_language"
    case "commitment":
      return "study_commitment"
    case "target-date":
      return "target_date"
    case "workspace":
      return "workspace"
    case "ready":
      return "completed"
  }
}

/**
 * Deep-link security guard:
 * Verifies if the candidate can directly navigate to targetStage given their current persisted state.
 * Users are allowed to navigate backwards to inspect or edit any earlier completed step,
 * but cannot skip forward beyond their currently achieved onboarding state.
 */
export function canAccessStage(
  currentDbState: string | null | undefined,
  targetStage: OnboardingStage
): boolean {
  if (currentDbState === "completed") {
    return true
  }
  const currentMaxStage = mapDbStateToStage(currentDbState)
  const currentMaxIndex = getStageIndex(currentMaxStage)
  const targetIndex = getStageIndex(targetStage)

  return targetIndex <= currentMaxIndex
}

/**
 * Calculates human-readable progress and percentage.
 * Total numbered steps for user presentation exclude welcome (0) and ready (celebration).
 * Steps 1 to 6 (Profile, Target, Language, Commitment, Target Date, Workspace).
 */
export function calculateProgress(stage: OnboardingStage): {
  currentStep: number
  totalSteps: number
  percent: number
  stageName: string
} {
  const STAGE_LABELS: Record<OnboardingStage, string> = {
    welcome: "Welcome",
    profile: "Profile",
    target: "Career Target",
    language: "Interview Language",
    commitment: "Study Commitment",
    "target-date": "Target Date",
    workspace: "Workspace Setup",
    ready: "Ready",
  }

  const totalSteps = 6 // Steps from profile to workspace
  const index = getStageIndex(stage)

  let currentStep = 0
  let percent = 0

  if (stage === "welcome") {
    currentStep = 0
    percent = 5
  } else if (stage === "ready") {
    currentStep = 6
    percent = 100
  } else {
    currentStep = index // profile is 1, workspace is 6
    percent = Math.round((currentStep / totalSteps) * 100)
  }

  return {
    currentStep,
    totalSteps,
    percent,
    stageName: STAGE_LABELS[stage],
  }
}
