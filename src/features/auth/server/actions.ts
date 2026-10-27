"use server"
import "server-only"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { logEvent } from "@/lib/observability/logger.server"

/**
 * Server action to sign out the active Supabase session securely.
 * Invalidates HTTP-only session cookies and redirects to /login.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()

  logEvent("info", "auth_signed_out", {})

  redirect("/login")
}
