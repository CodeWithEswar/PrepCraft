// @vitest-environment node
import { describe, expect, it } from "vitest"
import { resolvePostAuthDestination } from "@/features/auth/services/post-auth-resolver"
import type { UserProfile, WorkspaceSummary } from "@/features/auth/types/auth.types"

const mockProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: "user-123",
  displayName: "Eswar",
  avatarUrl: "https://example.com/avatar.png",
  graduationYear: 2024,
  collegeName: "Tech Institute",
  preferredCodingLanguage: "java",
  timezone: "Asia/Kolkata",
  onboardingState: "completed",
  onboardingCompletedAt: "2026-01-01T00:00:00Z",
  lastActiveWorkspaceId: "ws-primary",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
})

const mockWorkspaces: WorkspaceSummary[] = [
  {
    id: "ws-primary",
    slug: "amazon-sde",
    name: "Amazon SDE Preparation",
    role: "owner",
    status: "active",
  },
  {
    id: "ws-secondary",
    slug: "google-l4",
    name: "Google L4 Preparation",
    role: "member",
    status: "active",
  },
]

describe("Post-Auth Resolver Domain Service", () => {
  it("redirects unauthenticated sessions to /login", () => {
    const result = resolvePostAuthDestination({
      userId: null,
      profile: null,
      workspaces: [],
    })

    expect(result).toEqual({
      status: "UNAUTHENTICATED",
      destination: "/login",
    })
  })

  it("routes candidates with missing profiles to /onboarding/profile", () => {
    const result = resolvePostAuthDestination({
      userId: "user-123",
      profile: null,
      workspaces: [],
    })

    expect(result).toEqual({
      status: "ONBOARDING_REQUIRED",
      step: "profile",
      destination: "/onboarding/profile",
    })
  })

  it("resumes exact onboarding step when onboarding is incomplete", () => {
    const steps = [
      { state: "not_started" as const, expectedPath: "/onboarding/profile" },
      { state: "profile" as const, expectedPath: "/onboarding/profile" },
      { state: "career_target" as const, expectedPath: "/onboarding/career_target" },
      { state: "coding_language" as const, expectedPath: "/onboarding/coding_language" },
      { state: "study_commitment" as const, expectedPath: "/onboarding/study_commitment" },
      { state: "target_date" as const, expectedPath: "/onboarding/target_date" },
      { state: "workspace" as const, expectedPath: "/onboarding/workspace" },
    ]

    for (const { state, expectedPath } of steps) {
      const result = resolvePostAuthDestination({
        userId: "user-123",
        profile: mockProfile({
          onboardingState: state,
          onboardingCompletedAt: null,
        }),
        workspaces: [],
      })

      expect(result).toEqual({
        status: "ONBOARDING_REQUIRED",
        step: state,
        destination: expectedPath,
      })
    }
  })

  it("routes users with zero workspaces to /onboarding/workspace", () => {
    const result = resolvePostAuthDestination({
      userId: "user-123",
      profile: mockProfile(),
      workspaces: [],
    })

    expect(result).toEqual({
      status: "WORKSPACE_REQUIRED",
      destination: "/onboarding/workspace",
    })
  })

  it("routes users whose workspace memberships are all revoked to /onboarding/workspace", () => {
    const result = resolvePostAuthDestination({
      userId: "user-123",
      profile: mockProfile(),
      workspaces: [
        {
          id: "ws-revoked",
          slug: "revoked-workspace",
          name: "Revoked",
          role: "member",
          status: "revoked",
        },
      ],
    })

    expect(result).toEqual({
      status: "WORKSPACE_REQUIRED",
      destination: "/onboarding/workspace",
    })
  })

  it("routes returning candidate to their last active workspace", () => {
    const result = resolvePostAuthDestination({
      userId: "user-123",
      profile: mockProfile({ lastActiveWorkspaceId: "ws-secondary" }),
      workspaces: mockWorkspaces,
    })

    expect(result).toEqual({
      status: "AUTHORIZED",
      workspaceSlug: "google-l4",
      destination: "/w/google-l4/today",
    })
  })

  it("falls back to first accessible workspace when lastActiveWorkspaceId was deleted or revoked", () => {
    const result = resolvePostAuthDestination({
      userId: "user-123",
      profile: mockProfile({ lastActiveWorkspaceId: "ws-deleted-999" }),
      workspaces: mockWorkspaces,
    })

    expect(result).toEqual({
      status: "AUTHORIZED",
      workspaceSlug: "amazon-sde",
      destination: "/w/amazon-sde/today",
    })
  })

  it("honors safe return path for authorized workspace destination", () => {
    const result = resolvePostAuthDestination({
      userId: "user-123",
      profile: mockProfile(),
      workspaces: mockWorkspaces,
      requestedReturnTo: "/w/amazon-sde/practice",
    })

    expect(result).toEqual({
      status: "AUTHORIZED",
      workspaceSlug: "amazon-sde",
      destination: "/w/amazon-sde/practice",
    })
  })

  it("ignores malicious return path and safely defaults to authorized workspace /today", () => {
    const result = resolvePostAuthDestination({
      userId: "user-123",
      profile: mockProfile(),
      workspaces: mockWorkspaces,
      requestedReturnTo: "https://evil.example.com",
    })

    expect(result).toEqual({
      status: "AUTHORIZED",
      workspaceSlug: "amazon-sde",
      destination: "/w/amazon-sde/today",
    })
  })
})
