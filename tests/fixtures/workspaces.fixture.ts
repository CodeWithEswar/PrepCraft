/**
 * PrepCraft Test Fixtures — Workspaces & User Profiles
 * Standard test data structures for unit and integration testing.
 */

export const mockUser = {
  id: "usr_test_1234567890",
  email: "candidate@prepcraft.dev",
  user_metadata: {
    full_name: "Test Candidate",
    avatar_url: "https://prepcraft.dev/brand/avatar-placeholder.png",
  },
}

export const mockWorkspace = {
  id: "wks_test_0987654321",
  slug: "tier-1-sde",
  name: "Tier-1 Tech Preparation",
  targetCompany: "Google",
  targetRole: "Software Engineer II",
  targetDeadline: "2026-12-01T00:00:00.000Z",
  ownerId: mockUser.id,
  createdAt: "2026-10-24T00:00:00.000Z",
}

export const mockWorkspaceMembership = {
  workspaceId: mockWorkspace.id,
  userId: mockUser.id,
  role: "owner" as const,
  joinedAt: "2026-10-24T00:00:00.000Z",
}
