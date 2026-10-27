import * as React from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { AppIcon } from "@/components/app-icon"
import { resolveWorkspace } from "@/features/workspaces/server"
import {
  getPublishedTemplates,
  getRecommendedTemplates,
  getTemplateDetail,
  applyTemplateAction,
} from "@/features/templates/server"
import { TemplateBrowser } from "@/features/templates"
import type { TemplateDetail } from "@/features/templates"

import { connection } from "next/server"

export const instant = false

interface WorkspaceTemplatesPageProps {
  params: Promise<{
    workspaceSlug: string
  }>
}

export default async function WorkspaceTemplatesPage({
  params,
}: WorkspaceTemplatesPageProps) {
  await connection()
  const { workspaceSlug } = await params

  const context = await resolveWorkspace(workspaceSlug)
  if (!context) {
    notFound()
  }

  const { workspace, target } = context

  // 1. Fetch published templates and recommendations in parallel
  const [templates, recommendations] = await Promise.all([
    getPublishedTemplates(),
    getRecommendedTemplates({
      companyId: target?.companyId,
      companyName: target?.companyName,
      roleId: target?.roleId,
      roleName: target?.roleName,
      roleFamily: target?.roleFamily,
    }),
  ])

  // 2. Fetch hydrated details for preview sheet
  const templateDetailsMap: Record<string, TemplateDetail> = {}
  await Promise.all(
    templates.map(async (tmpl) => {
      const detail = await getTemplateDetail(tmpl.id, tmpl.currentVersionNumber)
      if (detail) {
        templateDetailsMap[tmpl.id] = detail
      }
    })
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Back to workspace settings navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href={`/w/${workspace.slug}/settings`}
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-mono"
        >
          <AppIcon icon="arrow-left" size="xs" />
          <span>Back to Workspace Settings</span>
        </Link>
      </div>

      {/* Main Template Browser Surface */}
      <TemplateBrowser
        templates={templates}
        recommendations={recommendations}
        workspaceId={workspace.id}
        currentTemplateId={target?.templateId}
        currentTemplateName={
          target?.templateId
            ? templates.find((t) => t.id === target.templateId)?.name
            : null
        }
        targetContext={{
          companyName: target?.companyName,
          roleName: target?.roleName,
          interviewLanguage: target?.interviewLanguage,
        }}
        templateDetailsMap={templateDetailsMap}
        onApplyAction={applyTemplateAction}
      />
    </div>
  )
}
