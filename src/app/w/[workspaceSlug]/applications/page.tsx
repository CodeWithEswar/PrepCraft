import * as React from "react"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { AppIcon } from "@/components/app-icon"

interface SectionPageProps {
  params: Promise<{
    workspaceSlug: string
  }>
}

export const instant = false

export default async function ApplicationsPage({ params }: SectionPageProps) {
  await connection()
  const { workspaceSlug } = await params
  const context = await resolveWorkspace(workspaceSlug)
  if (!context) notFound()

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {context.workspace.name} · Applications
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Application pipeline and interview round tracking for {context.target?.companyName || "this goal"}.
        </p>
      </div>

      <Card className="border-border/70 bg-card/60 p-6 text-center space-y-2">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <AppIcon icon="file" size="md" />
        </div>
        <CardTitle className="text-sm font-semibold">Application Pipeline Isolated</CardTitle>
        <CardDescription className="text-xs text-muted-foreground max-w-sm mx-auto">
          Job applications, referral contacts, and interview stages are scoped strictly to workspace {context.workspace.slug}.
        </CardDescription>
      </Card>
    </div>
  )
}
