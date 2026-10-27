import * as React from "react"
import { connection } from "next/server"
import { requireOnboardingStage, saveLanguageStepAction } from "@/features/onboarding/server"
import { OnboardingShell, LanguageStep, type CodingLanguage } from "@/features/onboarding"

export const instant = false

export default async function LanguagePage() {
  await connection()
  const context = await requireOnboardingStage("language")

  const initialLanguage = (context.draft?.preferredCodingLanguage ||
    context.preferredCodingLanguage ||
    "java") as CodingLanguage

  return (
    <OnboardingShell currentStage="language">
      <LanguageStep
        initialLanguage={initialLanguage}
        onSaveAction={saveLanguageStepAction}
      />
    </OnboardingShell>
  )
}
