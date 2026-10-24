// @vitest-environment node
import { expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import type { CookieMethodsServer } from "@supabase/ssr"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/env/public", () => ({ getSupabaseEnvironment: () => ({url:"https://example.supabase.co",key:"sb_publishable_example"}) }))
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url:string, _key:string, options:{cookies:CookieMethodsServer}) => ({
    auth: { getUser: async () => {
      await options.cookies.setAll!([{name:"first",value:"one",options:{httpOnly:true}}],{"Cache-Control":"private, no-store","Pragma":"no-cache"})
      // SSR supplies headers only with the first refresh write.
      await options.cookies.setAll!([{name:"second",value:"two",options:{httpOnly:true}}],{})
      return {data:{user:null},error:null}
    } },
  }),
}))

import { updateSession } from "@/lib/supabase/session"

it("preserves earlier cookies and cache protection across SSR refresh writes",async()=>{
  const request=new NextRequest("http://localhost:3030")
  const response=await updateSession(request)
  expect(response.headers.get("cache-control")).toBe("private, no-store")
  expect(response.headers.get("pragma")).toBe("no-cache")
  expect(response.cookies.get("first")?.value).toBe("one")
  expect(response.cookies.get("second")?.value).toBe("two")
  expect(response.cookies.get("first")?.httpOnly).toBe(true)
  expect(request.cookies.get("second")?.value).toBe("two")
})
