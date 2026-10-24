import fs from "node:fs/promises"
import path from "node:path"
import { checkDependencies } from "./dependency-rules.mjs"

const root = path.resolve(import.meta.dirname, "../..")
const files = new Map()
async function collect(directory) {
  for (const entry of await fs.readdir(path.join(root,directory), {withFileTypes:true})) {
    const file = `${directory}/${entry.name}`
    if (entry.isDirectory()) {
      if (["node_modules", ".wrangler"].includes(entry.name)) continue
      await collect(file)
    } else if (/\.tsx?$/.test(file) && !/\.(test|spec)\.tsx?$/.test(file)) files.set(file, await fs.readFile(path.join(root,file),"utf8"))
  }
}
await collect("src")
await collect("cloudflare")
const errors = checkDependencies(files)
if (errors.length) { console.error(errors.join("\n")); process.exitCode=1 }
else console.log(`Architecture checks passed: ${files.size} modules; dependency direction, feature entries, environment access, server boundaries and cycles.`)
