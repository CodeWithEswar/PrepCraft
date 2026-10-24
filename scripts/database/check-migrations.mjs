import fs from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dirname,"../..")
const directory = path.join(root,"supabase/migrations")
const migrations = (await fs.readdir(directory)).filter(name=>name.endsWith(".sql")).sort()
const timestamps = new Set()
for (const name of migrations) {
  const match = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(name)
  if (!match || timestamps.has(match[1])) throw new Error(`Invalid or duplicate migration timestamp: ${name}`)
  timestamps.add(match[1])
  const sql = await fs.readFile(path.join(directory,name),"utf8")
  if (!sql.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g,"").trim()) throw new Error(`Empty migration: ${name}`)
}
console.log(`Migration naming check passed: ${migrations.length} migration(s). This does not execute SQL or verify live RLS.`)
if (!migrations.length) console.log("Phase 03: no application schema yet. SQL/RLS baseline checks require Supabase + Docker: npm run db:test.")
