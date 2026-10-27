/**
 * TanStack Query keys factory with strict workspace isolation.
 * Mandate: No query key for workspace-scoped data may omit the workspace ID.
 */
export const workspaceQueryKeys = {
  all: () => ["workspaces"] as const,
  lists: () => [...workspaceQueryKeys.all(), "list"] as const,
  workspace: (workspaceId: string) => [...workspaceQueryKeys.all(), workspaceId] as const,
  detail: (workspaceId: string) => [...workspaceQueryKeys.workspace(workspaceId), "detail"] as const,
  target: (workspaceId: string) => [...workspaceQueryKeys.workspace(workspaceId), "target"] as const,
  preferences: (workspaceId: string) => [...workspaceQueryKeys.workspace(workspaceId), "preferences"] as const,
  plan: (workspaceId: string) => [...workspaceQueryKeys.workspace(workspaceId), "plan"] as const,
  activities: (workspaceId: string) => [...workspaceQueryKeys.workspace(workspaceId), "activities"] as const,
}

const PRESERVED_SECTIONS = [
  "today",
  "practice",
  "interview",
  "progress",
  "plan",
  "applications",
  "settings",
]

/**
 * Computes destination path when switching workspaces.
 * Preserves equivalent section (e.g. /w/old-slug/settings -> /w/new-slug/settings),
 * or falls back to /w/new-slug/today.
 */
export function resolveWorkspaceSwitchDestination(
  currentPathname: string,
  targetSlug: string
): string {
  if (!currentPathname || !targetSlug) {
    return `/w/${targetSlug}/today`
  }

  // Check if current path matches /w/[oldSlug]/[section]
  const match = /^\/w\/[^/]+\/([^/?#]+)/.exec(currentPathname)
  if (match) {
    const section = match[1]
    if (PRESERVED_SECTIONS.includes(section)) {
      return `/w/${targetSlug}/${section}`
    }
  }

  return `/w/${targetSlug}/today`
}
