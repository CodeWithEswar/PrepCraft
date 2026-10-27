import { describe, it, expect } from "vitest"
import {
  workspaceQueryKeys,
  resolveWorkspaceSwitchDestination,
} from "../services/workspace-switch"

describe("workspaceQueryKeys", () => {
  it("generates isolated query keys containing workspaceId", () => {
    const ws1 = "11111111-1111-1111-1111-111111111111"
    const ws2 = "22222222-2222-2222-2222-222222222222"

    const ws1Detail = workspaceQueryKeys.detail(ws1)
    const ws2Detail = workspaceQueryKeys.detail(ws2)

    expect(ws1Detail).toEqual(["workspaces", ws1, "detail"])
    expect(ws2Detail).toEqual(["workspaces", ws2, "detail"])
    expect(ws1Detail).not.toEqual(ws2Detail)

    const ws1Target = workspaceQueryKeys.target(ws1)
    const ws2Target = workspaceQueryKeys.target(ws2)
    expect(ws1Target).toEqual(["workspaces", ws1, "target"])
    expect(ws2Target).toEqual(["workspaces", ws2, "target"])
    expect(ws1Target).not.toEqual(ws2Target)

    const ws1Pref = workspaceQueryKeys.preferences(ws1)
    const ws1Plan = workspaceQueryKeys.plan(ws1)
    const ws1Activities = workspaceQueryKeys.activities(ws1)

    expect(ws1Pref).toEqual(["workspaces", ws1, "preferences"])
    expect(ws1Plan).toEqual(["workspaces", ws1, "plan"])
    expect(ws1Activities).toEqual(["workspaces", ws1, "activities"])
  })
})

describe("resolveWorkspaceSwitchDestination", () => {
  const targetSlug = "google-l4"

  it("preserves known equivalent section routes", () => {
    expect(resolveWorkspaceSwitchDestination("/w/amazon-sde-i/today", targetSlug)).toBe("/w/google-l4/today")
    expect(resolveWorkspaceSwitchDestination("/w/amazon-sde-i/practice", targetSlug)).toBe("/w/google-l4/practice")
    expect(resolveWorkspaceSwitchDestination("/w/amazon-sde-i/interview", targetSlug)).toBe("/w/google-l4/interview")
    expect(resolveWorkspaceSwitchDestination("/w/amazon-sde-i/progress", targetSlug)).toBe("/w/google-l4/progress")
    expect(resolveWorkspaceSwitchDestination("/w/amazon-sde-i/plan", targetSlug)).toBe("/w/google-l4/plan")
    expect(resolveWorkspaceSwitchDestination("/w/amazon-sde-i/applications", targetSlug)).toBe("/w/google-l4/applications")
    expect(resolveWorkspaceSwitchDestination("/w/amazon-sde-i/settings", targetSlug)).toBe("/w/google-l4/settings")
  })

  it("falls back to today dashboard when switching from unknown or non-workspace routes", () => {
    expect(resolveWorkspaceSwitchDestination("/w/amazon-sde-i/unknown-page", targetSlug)).toBe("/w/google-l4/today")
    expect(resolveWorkspaceSwitchDestination("/settings/workspaces", targetSlug)).toBe("/w/google-l4/today")
    expect(resolveWorkspaceSwitchDestination("", targetSlug)).toBe("/w/google-l4/today")
  })
})
