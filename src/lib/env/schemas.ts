import { z } from "zod"

const optionalText = z.preprocess(value => value === "" ? undefined : value, z.string().optional())
const httpUrl = z.url().refine(value => ["http:", "https:"].includes(new URL(value).protocol), "Use an HTTP(S) URL")

function isPublicSupabaseKey(value: string) {
  if (/^sb_publishable_[\w-]+$/.test(value)) return true
  try {
    const parts = value.split(".")
    if (parts.length !== 3) return false
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(payload)).role === "anon"
  } catch { return false }
}

const supabaseSchema = z.object({
  url: httpUrl,
  key: z.string().min(1).refine(isPublicSupabaseKey, "Use a publishable or legacy anon key; privileged keys are forbidden"),
})

export function parseSupabaseEnvironment(input: {
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
}) {
  const result = supabaseSchema.safeParse({
    url: input.NEXT_PUBLIC_SUPABASE_URL,
    key: input.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || input.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
  if (!result.success) throw new Error("Supabase configuration is missing or invalid. Set NEXT_PUBLIC_SUPABASE_URL and a public publishable/anon key. Privileged keys are forbidden.")
  return result.data
}

const serverSchema = z.object({
  NEXT_PUBLIC_APP_URL: optionalText.pipe(httpUrl.optional()),
  VERCEL_PROJECT_PRODUCTION_URL: optionalText,
  ENABLE_BRAND_PREVIEW: z.preprocess(value => value === "" || value === undefined ? "false" : value, z.enum(["true", "false"])),
})

export function parseServerEnvironment(input: Record<string, string | undefined>) {
  const result = serverSchema.safeParse(input)
  if (!result.success) throw new Error(`Invalid environment configuration: ${result.error.issues.map(issue => issue.path.join(".")).join(", ")}`)
  const { NEXT_PUBLIC_APP_URL, VERCEL_PROJECT_PRODUCTION_URL, ENABLE_BRAND_PREVIEW } = result.data
  const origin = NEXT_PUBLIC_APP_URL || (VERCEL_PROJECT_PRODUCTION_URL ? `https://${VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3030")
  if (!httpUrl.safeParse(origin).success) throw new Error("Invalid application origin configuration")
  return { appUrl: origin, enableBrandPreview: ENABLE_BRAND_PREVIEW === "true" }
}
