import { redirect } from "next/navigation"
import { getOnboardingState } from "@/features/onboarding/server"
import { mapDbStateToStage } from "@/features/onboarding"

export const instant = false

export default async function OnboardingRootPage() {
  const context = await getOnboardingState()

  if (!context) {
    redirect("/login?returnTo=/onboarding")
  }

  if (context.onboardingState === "completed") {
    redirect("/onboarding/ready")
  }

  const currentStage = mapDbStateToStage(context.onboardingState)
  redirect(`/onboarding/${currentStage}`)
}
