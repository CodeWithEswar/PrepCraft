/**
 * PrepCraft Template & Curriculum Query Keys
 * 
 * Strict Isolation Rule:
 * Never use an unscoped ['curriculum'] for workspace-owned data.
 * All workspace curriculum queries MUST be scoped by workspaceId.
 */

export const templateQueryKeys = {
  all: ["templates"] as const,
  published: (filters?: Record<string, unknown>) =>
    filters ? (["templates", "published", filters] as const) : (["templates", "published"] as const),
  detail: (templateId: string, versionId?: string) =>
    versionId
      ? (["templates", templateId, versionId] as const)
      : (["templates", templateId] as const),
  workspaceCurriculum: (workspaceId: string) =>
    ["workspace", workspaceId, "curriculum"] as const,
  workspaceTemplate: (workspaceId: string) =>
    ["workspace", workspaceId, "template"] as const,
}
