#!/usr/bin/env node
/**
 * PrepCraft — Local Development Environment Diagnostic
 * Checks Node version, environment files, and local dependencies.
 */

import fs from "node:fs"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "../..")

console.log("=== PrepCraft Local Environment Verification ===")

// 1. Node Version Check
const nodeVersion = process.versions.node
const [major] = nodeVersion.split(".").map(Number)
console.log(`Node.js Version: v${nodeVersion} ${major >= 20 ? "✓" : "⚠ (Node >= 20 recommended)"}`)

// 2. Environment file check
const envExamplePath = path.join(root, ".env.example")
const envLocalPath = path.join(root, ".env.local")

if (fs.existsSync(envExamplePath)) {
  console.log(".env.example: Present ✓")
} else {
  console.warn(".env.example: Missing ⚠")
}

if (fs.existsSync(envLocalPath)) {
  console.log(".env.local: Present ✓")
} else {
  console.log(".env.local: Not found (Copy .env.example to .env.local when configuring local Supabase)")
}

// 3. Pinned port check
const pkgJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
const devScript = pkgJson.scripts?.dev ?? ""
if (devScript.includes("-p 3030")) {
  console.log("Port Configuration: Dev server pinned to port 3030 ✓")
}

console.log("Environment check complete. Run `npm run dev` to start the application.")
