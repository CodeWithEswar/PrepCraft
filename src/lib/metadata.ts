import type { Metadata, Viewport } from "next"

const title = "PrepCraft — Craft your way to ready."
const description = "Craft your way to ready. Plan, practice, revise, track, and improve your coding and career readiness."
// Configure the real deployment origin; never invent a PrepCraft domain.
const origin = process.env.NEXT_PUBLIC_APP_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3030")

export const brandMetadata: Metadata = {
  metadataBase: new URL(origin),
  applicationName: "PrepCraft",
  title: { default: title, template: "%s | PrepCraft" },
  description,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/brand/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/brand/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/favicon/favicon-48x48.png", type: "image/png", sizes: "48x48" },
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
