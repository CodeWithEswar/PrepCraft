import type { Metadata, Viewport } from "next"
import { serverEnv } from "@/lib/env/server"

const title = "PrepCraft — Craft your way to ready"
const description = "Plan practice, track mistakes, schedule revision and understand your interview readiness in one focused workspace. Explore the PrepCraft product preview."
// Configure the real deployment origin; never invent a PrepCraft domain.
const origin = serverEnv.appUrl

export const brandMetadata: Metadata = {
  metadataBase: new URL(origin),
  applicationName: "PrepCraft",
  title: { default: title, template: "%s | PrepCraft" },
  description,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon/favicon-16x16.png?v=2", type: "image/png", sizes: "16x16" },
      { url: "/brand/favicon/favicon-32x32.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/brand/favicon/favicon-48x48.png?v=2", type: "image/png", sizes: "48x48" },
      { url: "/brand/favicon/favicon.svg?v=2", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/brand/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "PrepCraft", statusBarStyle: "default" },
  openGraph: {
    type: "website", siteName: "PrepCraft", title, description, locale: "en_US",
    images: [{ url: "/brand/social/og-default.png", width: 1200, height: 630, alt: "PrepCraft — Craft your way to ready." }],
  },
  twitter: { card: "summary_large_image", title, description, images: [{ url: "/brand/social/twitter-card.png", alt: "PrepCraft — Craft your way to ready." }] },
}

export const brandViewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3ECE4" },
    { media: "(prefers-color-scheme: dark)", color: "#171514" },
  ],
}
