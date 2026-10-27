/**
 * Generates URL-friendly, collision-safe base slugs from human workspace names.
 */
export function slugifyWorkspaceName(name: string): string {
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (!clean) {
    return "prep-workspace"
  }

  // Cap at 48 characters for readable, clean URLs
  return clean.slice(0, 48).replace(/-+$/, "")
}
