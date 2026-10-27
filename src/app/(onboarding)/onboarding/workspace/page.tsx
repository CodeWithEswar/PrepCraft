import * as React from "react"
import { connection } from "next/server"
import { requireOnboardingStage, getAvailableTemplates, createInitialWorkspaceAction } from "@/features/onboarding/server"
import { OnboardingShell, WorkspaceStep } from "@/features/onboarding"

export const instant = false

export default async function WorkspacePage() {
  await connection()
  const [context, templates] = await Promise.all([
    requireOnboardingStage("workspace"),
    getAvailableTemplates(),
  ])

  return (
    <OnboardingShell currentStage="workspace" cardClassName="max-w-[620px]">
      <WorkspaceStep
        draftContext={{
          targetRoleFamily: context.draft?.targetRoleFamily,
          targetRoleName: context.draft?.targetRoleName,
          targetCompanyName: context.draft?.targetCompanyName || context.draft?.customCompanyName,
          preferredCodingLanguage: context.draft?.preferredCodingLanguage || context.preferredCodingLanguage,
          weeklyTargetMinutes: context.draft?.weeklyTargetMinutes,
          studyDays: context.draft?.studyDays,
          targetDate: context.draft?.targetDate,
          workspaceName: context.draft?.workspaceName,
          selectedTemplateId: context.draft?.selectedTemplateId,
        }}
        availableTemplates={templates}
        onCreateAction={createInitialWorkspaceAction}
      />
    </OnboardingShell>
  )
}
