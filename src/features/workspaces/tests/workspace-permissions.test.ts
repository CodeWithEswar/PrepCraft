import { describe, it, expect } from "vitest"
import { resolveWorkspacePermissions } from "../services/workspace-permissions"
import type { WorkspaceMembership } from "../types/workspace.types"

describe("resolveWorkspacePermissions", () => {
  const baseMembership: WorkspaceMembership = {
    id: "mem-1",
    workspaceId: "ws-1",
    userId: "user-1",
    role: "owner",
    status: "active",
    joinedAt: "2026-10-24T00:00:00Z",
    createdAt: "2026-10-24T00:00:00Z",
    updatedAt: "2026-10-24T00:00:00Z",
  }

  describe("active workspace", () => {
    it("grants full permissions to active owner", () => {
      const perms = resolveWorkspacePermissions(baseMembership, "active")

      expect(perms.canView).toBe(true)
      expect(perms.canEditTarget).toBe(true)
      expect(perms.canEditSchedule).toBe(true)
      expect(perms.canManageMembers).toBe(true)
      expect(perms.canArchive).toBe(true)
      expect(perms.canRestore).toBe(false) // cannot restore an already active workspace
      expect(perms.canDelete).toBe(true)
    })

    it("restricts member permissions to view and study operations", () => {
      const perms = resolveWorkspacePermissions(
        { ...baseMembership, role: "member" },
        "active"
      )

      expect(perms.canView).toBe(true)
      expect(perms.canEditTarget).toBe(false)
      expect(perms.canEditSchedule).toBe(false)
      expect(perms.canManageMembers).toBe(false)
      expect(perms.canArchive).toBe(false)
      expect(perms.canRestore).toBe(false)
      expect(perms.canDelete).toBe(false)
    })
  })

  describe("archived workspace", () => {
    it("locks mutations for owner on archived workspace but allows restore", () => {
      const perms = resolveWorkspacePermissions(baseMembership, "archived")

      expect(perms.canView).toBe(true) // archived data remains viewable
      expect(perms.canEditTarget).toBe(false) // editing is disabled while archived
      expect(perms.canEditSchedule).toBe(false)
      expect(perms.canManageMembers).toBe(false)
      expect(perms.canArchive).toBe(false) // already archived
      expect(perms.canRestore).toBe(true) // owner can restore
      expect(perms.canDelete).toBe(true)
    })

    it("prevents non-owner member from restoring an archived workspace", () => {
      const perms = resolveWorkspacePermissions(
        { ...baseMembership, role: "member" },
        "archived"
      )

      expect(perms.canView).toBe(true)
      expect(perms.canEditTarget).toBe(false)
      expect(perms.canArchive).toBe(false)
      expect(perms.canRestore).toBe(false)
      expect(perms.canDelete).toBe(false)
    })
  })

  describe("inactive membership states", () => {
    it("denies all permissions when membership is disabled", () => {
      const perms = resolveWorkspacePermissions(
        { ...baseMembership, status: "disabled" },
        "active"
      )

      expect(perms.canView).toBe(false)
      expect(perms.canEditTarget).toBe(false)
      expect(perms.canEditSchedule).toBe(false)
      expect(perms.canManageMembers).toBe(false)
      expect(perms.canArchive).toBe(false)
      expect(perms.canRestore).toBe(false)
      expect(perms.canDelete).toBe(false)
    })

    it("denies all permissions when membership is invited but not yet accepted", () => {
      const perms = resolveWorkspacePermissions(
        { ...baseMembership, status: "invited" },
        "active"
      )

      expect(perms.canView).toBe(false)
      expect(perms.canEditTarget).toBe(false)
    })

    it("denies all permissions when membership is revoked", () => {
      const perms = resolveWorkspacePermissions(
        { ...baseMembership, status: "revoked" },
        "active"
      )

      expect(perms.canView).toBe(false)
    })
  })
})
