import * as React from "react"
import { connection } from "next/server"
import { requireOnboardingStage, saveTargetStepAction } from "@/features/onboarding/server"
import { OnboardingShell, TargetStep } from "@/features/onboarding"

export const instant = false

export default async function TargetPage() {
  await connection()
  const context = await requireOnboardingStage("target")

  return (
    <OnboardingShell currentStage="target">
      <TargetStep
        initialValues={{
          roleFamily: context.draft?.targetRoleFamily,
          roleName: context.draft?.targetRoleName,
          targetCompanyId: context.draft?.targetCompanyId,
          customCompanyName: context.draft?.customCompanyName,
        }}
        onSaveAction={saveTargetStepAction}
      />
    </OnboardingShell>
  )
}
