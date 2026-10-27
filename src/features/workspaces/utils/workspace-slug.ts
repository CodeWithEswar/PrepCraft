export function slugifyWorkspaceName(name: string): string {
  if (!name || !name.trim()) return "prep-workspace"
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return clean || "prep-workspace"
}
