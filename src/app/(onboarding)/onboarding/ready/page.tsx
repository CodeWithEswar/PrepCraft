import * as React from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { requireOnboardingStage, getReadyWorkspaceDetails } from "@/features/onboarding/server"
import { OnboardingShell, ReadyStep } from "@/features/onboarding"

export const instant = false

interface ReadyPageProps {
  searchParams: Promise<{
    workspace?: string
  }>
}

export default async function ReadyPage({ searchParams }: ReadyPageProps) {
  await connection()
  const context = await requireOnboardingStage("ready")
  const resolvedParams = await searchParams
  const readyData = await getReadyWorkspaceDetails(context.userId, resolvedParams?.workspace)

  const data = readyData || {
    workspace: {
      id: context.lastActiveWorkspaceId || "workspace",
      name: "Software Engineer Preparation",
      slug: "general-sde-preparation",
    },
    roleName: "Software Engineer",
    companyName: null,
    targetDate: null,
    preferredCodingLanguage: context.preferredCodingLanguage || "java",
    weeklyTargetMinutes: 600,
    studyDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    plan: {
      templateId: "general-swe",
      totalWeeklyMinutes: 600,
      plannedSessions: 5,
      focusAreas: ["DSA Foundations", "Core CS Fundamentals", "System Design"],
      firstWeekPlan: [],
      starterItems: [
        {
          title: "Two Pointers & Sliding Window Foundations",
          tag: "DSA",
          durationMinutes: 45,
          description: "Master pattern identification and pointer boundary invariants.",
        },
        {
          title: "Memory Models & Garbage Collection Fundamentals",
          tag: "Core CS",
          durationMinutes: 30,
          description: "Heap vs stack allocation, pointer semantics, and reference escape analysis.",
        },
      ],
    },
  }

  return (
    <OnboardingShell currentStage="ready" cardClassName="max-w-[620px]">
      <ReadyStep data={data} />
    </OnboardingShell>
  )
}
