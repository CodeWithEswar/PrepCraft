#!/usr/bin/env node
/**
 * PrepCraft — Cache & Build Artifact Cleaner
 * Safely removes .next, test results, and TypeScript incremental buildinfo.
 */

import fs from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "../..")
const targets = [".next", "test-results", "tsconfig.tsbuildinfo"]

console.log("=== PrepCraft Build & Test Artifact Clean ===")

for (const target of targets) {
  const fullPath = path.join(root, target)
  try {
    const stat = await fs.stat(fullPath)
    if (stat.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true })
      console.log(`Cleaned directory: ${target} ✓`)
    } else {
      await fs.unlink(fullPath)
      console.log(`Removed file: ${target} ✓`)
    }
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      // Target did not exist, nothing to do
      continue
    }
    console.error(`Could not remove ${target}:`, err)
  }
}

console.log("Clean complete. Run `npm run typecheck` or `npm run dev` to rebuild cleanly.")
