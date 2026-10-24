import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseEnvironment } from "@/lib/env/public"
import type { Database } from "./types"

export function createClient() {
  const { url, key } = getSupabaseEnvironment()
  return createBrowserClient<Database>(url, key)
}
