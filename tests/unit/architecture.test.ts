// @vitest-environment node
import { expect, it } from "vitest"
import { checkDependencies } from "../../scripts/ci/dependency-rules.mjs"

it("rejects cycles and upward or deep feature dependencies", () => {
  const errors=checkDependencies(new Map([
    ["src/lib/bad.ts",'import "@/features/practice/private"'],
    ["src/features/practice/private.ts",'import "@/lib/bad"'],
  ]))
  expect(errors.some(error=>error.includes("Circular dependency"))).toBe(true)
  expect(errors.some(error=>error.includes("shared code cannot depend"))).toBe(true)
  expect(errors.some(error=>error.includes("public practice feature entry"))).toBe(true)
})
it("follows transitive client imports but permits type-only imports", () => {
  const files = new Map([
    ["src/features/demo/components/client.tsx",'"use client"; import "@/lib/bridge"'],
    ["src/lib/bridge.ts",'export { secret } from "./server"'],
    ["src/lib/server.ts",'import "server-only"; export const secret = 1'],
  ])
  expect(checkDependencies(files).some(error=>error.includes("client dependency reaches"))).toBe(true)
  files.set("src/lib/bridge.ts",'export type { Secret } from "./server"')
  expect(checkDependencies(files)).toEqual([])
})
it("requires centralized environment access and server markers", () => {
  expect(checkDependencies(new Map([["src/lib/server.ts",'const secret=process.env.PRIVATE_KEY']]))).toHaveLength(2)
})
