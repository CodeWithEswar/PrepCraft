import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseEnvironment } from "@/lib/env/public"
import { platformEnv,allowLiveBackend } from "@/lib/env/platform"
import { verifyBackendIsolation } from "@/lib/env/backend-isolation"

export async function updateSession(request: NextRequest) {
  // Isolated samples and public content need no database or identity refresh.
  if(request.nextUrl.pathname.startsWith("/preview")||!["/w/","/onboarding","/login","/signup","/auth/","/settings"].some(prefix=>request.nextUrl.pathname.startsWith(prefix)))return NextResponse.next()
  let supabaseResponse = NextResponse.next({
    request,
  })
  const refreshHeaders = new Headers()

  const { url, key } = getSupabaseEnvironment()
  verifyBackendIsolation(url,platformEnv.environment,allowLiveBackend)

  const supabase = createServerClient(
    url,
    key,
    {
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
          previousCookies.forEach((cookie) => supabaseResponse.cookies.set(cookie))
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          // SSR supplies cache-protection headers alongside refreshed cookies
          if (headers) {
            for (const [name, value] of Object.entries(headers)) {
              refreshHeaders.set(name, value)
            }
          }
          refreshHeaders.forEach((value, name) => supabaseResponse.headers.set(name, value))
        },
      },
    }
  )

  // IMPORTANT: Avoid writing logic between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect workspace and onboarding routes at the network edge
  // Server Components and Server Actions perform authoritative verification
  const isProtectedRoute = pathname.startsWith("/w/") || pathname.startsWith("/onboarding")

  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("reason", "unauthenticated")
    loginUrl.searchParams.set("returnTo", pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}
