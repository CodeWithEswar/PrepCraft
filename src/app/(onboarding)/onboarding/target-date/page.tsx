import * as React from "react"
import { connection } from "next/server"
import { requireOnboardingStage, saveTargetDateStepAction } from "@/features/onboarding/server"
import { OnboardingShell, TargetDateStep } from "@/features/onboarding"

export const instant = false

export default async function TargetDatePage() {
  await connection()
  const context = await requireOnboardingStage("target-date")

  return (
    <OnboardingShell currentStage="target-date">
      <TargetDateStep
        initialValues={{
          hasTargetDate: context.draft?.hasTargetDate,
          targetDate: context.draft?.targetDate,
        }}
        onSaveAction={saveTargetDateStepAction}
      />
    </OnboardingShell>
  )
}
