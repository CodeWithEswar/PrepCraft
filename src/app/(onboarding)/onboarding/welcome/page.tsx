import * as React from "react"
import { connection } from "next/server"
import { requireOnboardingStage, saveWelcomeStepAction } from "@/features/onboarding/server"
import { OnboardingShell, WelcomeStep } from "@/features/onboarding"

export const instant = false

export default async function WelcomePage() {
  await connection()
  await requireOnboardingStage("welcome")

  return (
    <OnboardingShell currentStage="welcome">
      <WelcomeStep onSaveAction={saveWelcomeStepAction} />
    </OnboardingShell>
  )
}
