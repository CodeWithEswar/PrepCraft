import { notFound } from "next/navigation"
import { getMockReview } from "@/features/mock-interviews/server"
import { InterviewDebrief } from "@/features/mock-interviews"

interface MockReviewPageProps {
  params: Promise<{
    workspaceSlug: string
    sessionId: string
  }>
}

export default async function MockReviewPage({ params }: MockReviewPageProps) {
  const { workspaceSlug, sessionId } = await params
  if (!workspaceSlug || !sessionId) notFound()

  const review = await getMockReview(workspaceSlug, sessionId)

  return (
    <div className="w-full bg-background text-foreground min-h-screen">
      <InterviewDebrief review={review} workspaceSlug={workspaceSlug} />
    </div>
  )
}
