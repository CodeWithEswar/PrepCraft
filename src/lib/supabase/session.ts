import "server-only"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseEnvironment } from "@/lib/env/public"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "./types"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  const refreshHeaders = new Headers()

  const { url, key } = getSupabaseEnvironment()

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        const previousCookies = supabaseResponse.cookies.getAll()
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        previousCookies.forEach(cookie => supabaseResponse.cookies.set(cookie))
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
        // SSR 0.12 supplies cache-protection headers alongside refreshed cookies.
        for (const [name, value] of Object.entries(headers)) refreshHeaders.set(name, value)
        refreshHeaders.forEach((value, name) => supabaseResponse.headers.set(name, value))
      },
    },
  })

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  await supabase.auth.getUser()

  return supabaseResponse
}
