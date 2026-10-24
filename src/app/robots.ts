import type { MetadataRoute } from "next"
import { serverEnv } from "@/lib/env/server"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = serverEnv.appUrl

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/callback", "/w/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
