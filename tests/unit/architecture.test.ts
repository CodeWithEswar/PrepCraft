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
it("enforces domain services in services/ remain pure and portable", () => {
  const badService = new Map([
    ["src/features/revision/services/scheduler.ts", 'import "server-only"; export const schedule = () => {}'],
  ])
  const errors = checkDependencies(badService)
  expect(errors.some(e => e.includes("domain services in services/ must remain pure and portable"))).toBe(true)

  const badNextService = new Map([
    ["src/features/revision/services/scheduler.ts", 'import { cookies } from "next/headers"; export const schedule = () => {}'],
  ])
  const errorsNext = checkDependencies(badNextService)
  expect(errorsNext.some(e => e.includes("do not import Next.js server runtime"))).toBe(true)

  const pureService = new Map([
    ["src/features/revision/services/scheduler.ts", 'export const calculateInterval = (day: number) => day * 2'],
  ])
  expect(checkDependencies(pureService)).toEqual([])
})
