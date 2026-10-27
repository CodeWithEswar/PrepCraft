// @vitest-environment node
import { describe, expect, it } from "vitest"
import {
  buildProfileBootstrapPayload,
  isOnboardingCompleted,
} from "@/features/auth/services/profile-bootstrap"

describe("Profile Bootstrap Service", () => {
  it("extracts display name and avatar from OAuth user metadata", () => {
    const payload = buildProfileBootstrapPayload({
      id: "auth-user-1",
      email: "candidate@gmail.com",
      user_metadata: {
        full_name: "Jane Doe",
        avatar_url: "https://lh3.googleusercontent.com/avatar.jpg",
      },
    })

    expect(payload).toEqual({
      id: "auth-user-1",
      displayName: "Jane Doe",
      avatarUrl: "https://lh3.googleusercontent.com/avatar.jpg",
      timezone: "UTC",
      onboardingState: "not_started",
    })
  })

  it("falls back to email username when full_name or name is missing", () => {
    const payload = buildProfileBootstrapPayload({
      id: "auth-user-2",
      email: "alexander.great@company.com",
      user_metadata: {},
    })

    expect(payload.displayName).toBe("alexander.great")
    expect(payload.avatarUrl).toBeNull()
  })

  it("sanitizes insecure avatar URLs", () => {
    const payload = buildProfileBootstrapPayload({
      id: "auth-user-3",
      email: "test@domain.com",
      user_metadata: {
        avatar_url: "http://insecure.com/avatar.jpg", // HTTP not HTTPS
      },
    })

    expect(payload.avatarUrl).toBeNull()
  })

  it("evaluates onboarding completion status accurately", () => {
    expect(
      isOnboardingCompleted({
        onboardingState: "completed",
        onboardingCompletedAt: null,
      })
    ).toBe(true)

    expect(
      isOnboardingCompleted({
        onboardingState: "workspace",
        onboardingCompletedAt: "2026-01-01T00:00:00Z",
      })
    ).toBe(true)

    expect(
      isOnboardingCompleted({
        onboardingState: "not_started",
        onboardingCompletedAt: null,
      })
    ).toBe(false)
  })
})
