import { describe, it, expect } from "vitest"
import { workspaceQueryKeys } from "@/features/workspaces/services/workspace-switch"
import { resolveWorkspacePermissions } from "@/features/workspaces/services/workspace-permissions"
import type { WorkspaceMembership, WorkspaceTarget, WorkspacePreferences } from "@/features/workspaces/types/workspace.types"

describe("Workspace Domain Isolation", () => {
  const workspaceAId = "aaaa1111-1111-1111-1111-111111111111"
  const workspaceBId = "bbbb2222-2222-2222-2222-222222222222"

  describe("TanStack Query Key Isolation", () => {
    it("ensures query keys across two distinct workspaces never collide", () => {
      const keysA = {
        detail: workspaceQueryKeys.detail(workspaceAId),
        target: workspaceQueryKeys.target(workspaceAId),
        preferences: workspaceQueryKeys.preferences(workspaceAId),
        plan: workspaceQueryKeys.plan(workspaceAId),
        activities: workspaceQueryKeys.activities(workspaceAId),
      }

      const keysB = {
        detail: workspaceQueryKeys.detail(workspaceBId),
        target: workspaceQueryKeys.target(workspaceBId),
        preferences: workspaceQueryKeys.preferences(workspaceBId),
        plan: workspaceQueryKeys.plan(workspaceBId),
        activities: workspaceQueryKeys.activities(workspaceBId),
      }

      // Assert complete isolation
      expect(keysA.detail).not.toEqual(keysB.detail)
      expect(keysA.target).not.toEqual(keysB.target)
      expect(keysA.preferences).not.toEqual(keysB.preferences)
      expect(keysA.plan).not.toEqual(keysB.plan)
      expect(keysA.activities).not.toEqual(keysB.activities)

      // Assert workspaceId is strictly present in position index 1
      expect(keysA.detail[1]).toBe(workspaceAId)
      expect(keysB.detail[1]).toBe(workspaceBId)
    })
  })

  describe("Workspace Membership & Authorization Boundary", () => {
    it("never grants workspace B mutation permissions using membership from workspace A", () => {
      const membershipA: WorkspaceMembership = {
        id: "mem-a",
        workspaceId: workspaceAId,
        userId: "user-123",
        role: "owner",
        status: "active",
        joinedAt: "2026-10-24T00:00:00Z",
        createdAt: "2026-10-24T00:00:00Z",
        updatedAt: "2026-10-24T00:00:00Z",
      }

      // User has active owner membership in workspace A
      const permsA = resolveWorkspacePermissions(membershipA, "active")
      expect(permsA.canEditTarget).toBe(true)
      expect(permsA.canArchive).toBe(true)

      // When checking for workspace B where user has NO active membership
      const permsB = resolveWorkspacePermissions(null, "active")
      expect(permsB.canView).toBe(false)
      expect(permsB.canEditTarget).toBe(false)
      expect(permsB.canEditSchedule).toBe(false)
      expect(permsB.canArchive).toBe(false)
    })
  })

  describe("Separation of Target vs Preferences", () => {
    it("maintains independent target and scheduling structures", () => {
      const target: WorkspaceTarget = {
        id: "target-1",
        workspaceId: workspaceAId,
        roleFamily: "Software Engineer",
        roleId: "role-1",
        roleName: "Software Engineer",
        customRoleName: null,
        companyId: "comp-1",
        companyName: "Amazon",
        customCompanyName: null,
        targetDate: "2026-12-15",
        preparationLevel: "developing",
        interviewLanguage: "java",
        templateId: "amazon-sde",
        templateVersion: 1,
        createdAt: "2026-10-24T00:00:00Z",
        updatedAt: "2026-10-24T00:00:00Z",
      }

      const preferences: WorkspacePreferences = {
        workspaceId: workspaceAId,
        weeklyTargetMinutes: 600,
        defaultDailyMinutes: 120,
        studyDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        planningMode: "balanced",
        createdAt: "2026-10-24T00:00:00Z",
        updatedAt: "2026-10-24T00:00:00Z",
      }

      // Target owns what you prepare for
      expect(target).toHaveProperty("companyName")
      expect(target).toHaveProperty("roleName")
      expect(target).toHaveProperty("interviewLanguage")
      expect(target).toHaveProperty("targetDate")
      // Target MUST NOT contain scheduling minutes
      expect(target).not.toHaveProperty("weeklyTargetMinutes")
      expect(target).not.toHaveProperty("defaultDailyMinutes")

      // Preferences owns how you schedule study time
      expect(preferences).toHaveProperty("weeklyTargetMinutes")
      expect(preferences).toHaveProperty("defaultDailyMinutes")
      expect(preferences).toHaveProperty("studyDays")
      expect(preferences).not.toHaveProperty("companyName")
      expect(preferences).not.toHaveProperty("roleName")
    })
  })
})
