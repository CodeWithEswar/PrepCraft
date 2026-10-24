import type { Metadata } from "next"
import { MarketingPage } from "@/features/marketing"

export const metadata: Metadata = {
  title: { absolute: "PrepCraft — Craft your way to ready" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
}

export default function HomePage() {
  return <MarketingPage />
}
