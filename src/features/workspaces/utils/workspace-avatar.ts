/**
 * Deterministic workspace avatar mark generation.
 * Avoids random colors or uploaded image requirements while remaining scannable.
 */

export function getWorkspaceInitials(name: string): string {
  if (!name || !name.trim()) return "WP"
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/^[0-9]+$/.test(w)) // prefer alphabetic words

  if (words.length >= 2) {
    const first = words[0][0] || ""
    const second = words[1][0] || ""
    return (first + second).toUpperCase()
  }

  const single = name.trim().replace(/[^a-zA-Z0-9]/g, "")
  if (single.length >= 2) {
    return single.slice(0, 2).toUpperCase()
  }
  return single.toUpperCase() || "WP"
}

/**
 * Deterministic color variant for workspace mark using hash of workspace name or ID.
 * Adheres strictly to Graphite Monochrome × Smoked Sienna palette.
 */
export function getWorkspaceMarkStyle(seed: string): {
  backgroundColor: string
  color: string
  borderColor: string
} {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const variant = Math.abs(hash) % 4

  switch (variant) {
    case 0:
      // Sienna tint
      return {
        backgroundColor: "rgba(161, 95, 75, 0.12)",
        color: "rgb(161, 95, 75)",
        borderColor: "rgba(161, 95, 75, 0.25)",
      }
    case 1:
      // Charcoal subtle
      return {
        backgroundColor: "rgba(120, 113, 108, 0.12)",
        color: "rgb(168, 162, 158)",
        borderColor: "rgba(120, 113, 108, 0.25)",
      }
    case 2:
      // Deep graphite
      return {
        backgroundColor: "rgba(68, 64, 60, 0.15)",
        color: "rgb(214, 211, 209)",
        borderColor: "rgba(87, 83, 78, 0.3)",
      }
    case 3:
    default:
      // Warm mineral
      return {
        backgroundColor: "rgba(180, 120, 100, 0.14)",
        color: "rgb(194, 120, 100)",
        borderColor: "rgba(180, 120, 100, 0.28)",
      }
  }
}
