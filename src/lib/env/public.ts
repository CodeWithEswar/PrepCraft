import { parseSupabaseEnvironment } from "./schemas"

// Literal property access is required for Next's public build-time substitution.
// Validate when this integration is used; the public marketing site needs no DB.
export function getSupabaseEnvironment() {
  return parseSupabaseEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}
