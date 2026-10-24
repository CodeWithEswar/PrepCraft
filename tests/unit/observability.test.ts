// @vitest-environment node
import { expect, it } from "vitest"
import { createLogRecord } from "@/lib/observability/log-record"

it("drops credentials, user content and unexpected context fields", () => {
  const record = createLogRecord("error","request.failed", {code:"unavailable",token:"private",email:"private@example.com",body:"private",error:new Error("private")})
  expect(record).toMatchObject({level:"error",event:"request.failed",code:"unavailable"})
  expect(JSON.stringify(record)).not.toContain("private")
  expect(()=>createLogRecord("error","user email: private@example.com")).toThrow()
})
