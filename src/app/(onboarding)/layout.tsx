import * as React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Onboarding | PrepCraft",
  description: "Guided workspace configuration for deliberate interview preparation.",
}

export const instant = false

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
