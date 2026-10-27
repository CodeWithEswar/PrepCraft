import * as React from "react"
import { connection } from "next/server"
import { requireOnboardingStage, saveProfileStepAction } from "@/features/onboarding/server"
import { OnboardingShell, ProfileStep } from "@/features/onboarding"

export const instant = false

export default async function ProfilePage() {
  await connection()
  const context = await requireOnboardingStage("profile")

  return (
    <OnboardingShell currentStage="profile">
      <ProfileStep
        initialValues={{
          displayName: context.displayName,
          avatarUrl: context.avatarUrl,
          collegeName: context.collegeName,
          graduationYear: context.graduationYear,
        }}
        onSaveAction={saveProfileStepAction}
      />
    </OnboardingShell>
  )
}
