// @vitest-environment node
import { describe, expect, it } from "vitest"
import { parseServerEnvironment, parseSupabaseEnvironment } from "@/lib/env/schemas"

describe("environment trust boundaries", () => {
  const url = "https://example.supabase.co"
  const jwt = (role:string) => `header.${Buffer.from(JSON.stringify({role})).toString("base64url")}.signature`
  it("rejects missing, malformed and privileged Supabase credentials without echoing input", () => {
    for (const key of [undefined,"placeholder-anon-key","sb_secret_private",jwt("service_role")]) {
      expect(()=>parseSupabaseEnvironment({NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key})).toThrow(/configuration/)
    }
    expect(()=>parseSupabaseEnvironment({NEXT_PUBLIC_SUPABASE_URL:"file:///private",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_example"})).toThrow()
  })
  it("accepts publishable keys and legacy anon keys", () => {
    expect(parseSupabaseEnvironment({NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_example"}).key).toBe("sb_publishable_example")
    expect(parseSupabaseEnvironment({NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_ANON_KEY:jwt("anon")}).url).toBe(url)
  })
  it("keeps marketing independent of DB configuration and validates optional flags", () => {
    expect(parseServerEnvironment({NEXT_PUBLIC_APP_URL:"",ENABLE_BRAND_PREVIEW:""})).toEqual({appUrl:"http://localhost:3030",enableBrandPreview:false})
    expect(parseServerEnvironment({NEXT_PUBLIC_APP_URL:"https://example.com",ENABLE_BRAND_PREVIEW:"true"})).toEqual({appUrl:"https://example.com",enableBrandPreview:true})
    expect(()=>parseServerEnvironment({ENABLE_BRAND_PREVIEW:"yes"})).toThrow()
    expect(()=>parseServerEnvironment({NEXT_PUBLIC_APP_URL:"javascript:alert(1)"})).toThrow()
  })
})
