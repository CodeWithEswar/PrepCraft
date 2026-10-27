// @vitest-environment node
import { describe, expect, it } from "vitest"
import {
  canAccessStage,
  calculateProgress,
  getNextStage,
  getPreviousStage,
  mapDbStateToStage,
  mapStageToDbState,
} from "../services/onboarding-transition"

describe("Onboarding Transition State Machine & Guards", () => {
  it("determines sequential next and previous stages accurately", () => {
    expect(getNextStage("welcome")).toBe("profile")
    expect(getNextStage("profile")).toBe("target")
    expect(getNextStage("target")).toBe("language")
    expect(getNextStage("language")).toBe("commitment")
    expect(getNextStage("commitment")).toBe("target-date")
    expect(getNextStage("target-date")).toBe("workspace")
    expect(getNextStage("workspace")).toBe("ready")
    expect(getNextStage("ready")).toBeNull()

    expect(getPreviousStage("welcome")).toBeNull()
    expect(getPreviousStage("profile")).toBe("welcome")
    expect(getPreviousStage("workspace")).toBe("target-date")
  })

  it("maps database onboarding states to UI stages correctly including legacy states", () => {
    expect(mapDbStateToStage("not_started")).toBe("welcome")
    expect(mapDbStateToStage("welcome")).toBe("welcome")
    expect(mapDbStateToStage("profile")).toBe("profile")
    expect(mapDbStateToStage("target")).toBe("target")
    expect(mapDbStateToStage("career_target")).toBe("target")
    expect(mapDbStateToStage("language")).toBe("language")
    expect(mapDbStateToStage("coding_language")).toBe("language")
    expect(mapDbStateToStage("commitment")).toBe("commitment")
    expect(mapDbStateToStage("study_commitment")).toBe("commitment")
    expect(mapDbStateToStage("target_date")).toBe("target-date")
    expect(mapDbStateToStage("target-date")).toBe("target-date")
    expect(mapDbStateToStage("workspace")).toBe("workspace")
    expect(mapDbStateToStage("ready")).toBe("ready")
    expect(mapDbStateToStage("completed")).toBe("ready")
  })

  it("maps UI stage back to DB state", () => {
    expect(mapStageToDbState("welcome")).toBe("welcome")
    expect(mapStageToDbState("profile")).toBe("profile")
    expect(mapStageToDbState("target")).toBe("career_target")
    expect(mapStageToDbState("language")).toBe("coding_language")
    expect(mapStageToDbState("commitment")).toBe("study_commitment")
    expect(mapStageToDbState("target-date")).toBe("target_date")
    expect(mapStageToDbState("workspace")).toBe("workspace")
    expect(mapStageToDbState("ready")).toBe("completed")
  })

  it("enforces deep-link access rules strictly", () => {
    // Brand new user at welcome
    expect(canAccessStage("not_started", "welcome")).toBe(true)
    expect(canAccessStage("not_started", "profile")).toBe(false)
    expect(canAccessStage("not_started", "workspace")).toBe(false)

    // User at language step
    expect(canAccessStage("language", "welcome")).toBe(true)
    expect(canAccessStage("language", "profile")).toBe(true)
    expect(canAccessStage("language", "target")).toBe(true)
    expect(canAccessStage("language", "language")).toBe(true)
    expect(canAccessStage("language", "commitment")).toBe(false)
    expect(canAccessStage("language", "workspace")).toBe(false)

    // User completed onboarding
    expect(canAccessStage("completed", "welcome")).toBe(true)
    expect(canAccessStage("completed", "workspace")).toBe(true)
    expect(canAccessStage("completed", "ready")).toBe(true)
  })

  it("calculates progress percentages correctly across stages", () => {
    const welcome = calculateProgress("welcome")
    expect(welcome.percent).toBe(5)
    expect(welcome.currentStep).toBe(0)

    const profile = calculateProgress("profile")
    expect(profile.currentStep).toBe(1)
    expect(profile.totalSteps).toBe(6)
    expect(profile.percent).toBe(17)

    const commitment = calculateProgress("commitment")
    expect(commitment.currentStep).toBe(4)
    expect(commitment.percent).toBe(67)

    const ready = calculateProgress("ready")
    expect(ready.percent).toBe(100)
    expect(ready.currentStep).toBe(6)
  })
})
