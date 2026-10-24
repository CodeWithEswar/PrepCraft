import "server-only"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseEnvironment } from "@/lib/env/public"
import { cookies } from "next/headers"
import type { Database } from "./types"

export async function createClient() {
  const cookieStore = await cookies()
  const { url, key } = getSupabaseEnvironment()

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
