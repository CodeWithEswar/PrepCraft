import { notFound } from "next/navigation"
import { getMockSession } from "@/features/mock-interviews/server"
import { InterviewChamber } from "@/features/mock-interviews"

interface MockChamberPageProps {
  params: Promise<{
    workspaceSlug: string
    sessionId: string
  }>
}

export default async function MockChamberPage({ params }: MockChamberPageProps) {
  const { workspaceSlug, sessionId } = await params
  if (!workspaceSlug || !sessionId) notFound()

  const session = await getMockSession(workspaceSlug, sessionId)

  return (
    <div className="h-screen overflow-hidden">
      <InterviewChamber session={session} workspaceSlug={workspaceSlug} />
    </div>
  )
}
