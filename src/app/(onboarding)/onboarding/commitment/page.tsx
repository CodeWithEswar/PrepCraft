import * as React from "react"
import { connection } from "next/server"
import { requireOnboardingStage, saveCommitmentStepAction } from "@/features/onboarding/server"
import { OnboardingShell, CommitmentStep } from "@/features/onboarding"

export const instant = false

export default async function CommitmentPage() {
  await connection()
  const context = await requireOnboardingStage("commitment")

  return (
    <OnboardingShell currentStage="commitment" cardClassName="max-w-[600px]">
      <CommitmentStep
        initialValues={{
          weeklyTargetMinutes: context.draft?.weeklyTargetMinutes,
          studyDays: context.draft?.studyDays,
          defaultDailyMinutes: context.draft?.defaultDailyMinutes,
        }}
        onSaveAction={saveCommitmentStepAction}
      />
    </OnboardingShell>
  )
}
