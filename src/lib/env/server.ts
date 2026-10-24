import "server-only"
import { parseServerEnvironment } from "./schemas"

export const serverEnv = parseServerEnvironment({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ENABLE_BRAND_PREVIEW: process.env.ENABLE_BRAND_PREVIEW,
})
