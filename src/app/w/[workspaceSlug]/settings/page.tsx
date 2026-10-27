import * as React from "react"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { resolveWorkspace, archiveWorkspaceAction, restoreWorkspaceAction } from "@/features/workspaces/server"
import { getCanonicalCompanies, getCanonicalRoles, updateTargetAction, updatePreferencesAction } from "@/features/targets/server"
import { getWorkspaceCurriculum, getAvailableTemplateUpgrade, getTemplateVersionDiff, upgradeTemplateAction } from "@/features/templates/server"
import { TargetEditor, ScheduleEditor } from "@/features/targets"
import { CurrentTemplateCard } from "@/features/templates"
import { WorkspaceStatusBadge, WorkspaceAvatar } from "@/features/workspaces"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsLifecycleSection } from "./settings-lifecycle"

interface WorkspaceSettingsPageProps {
  params: Promise<{
    workspaceSlug: string
  }>
}

export const instant = false

export default async function WorkspaceSettingsPage({ params }: WorkspaceSettingsPageProps) {
  await connection()
  const { workspaceSlug } = await params

  const [context, canonicalCompanies, canonicalRoles] = await Promise.all([
    resolveWorkspace(workspaceSlug),
    getCanonicalCompanies(),
    getCanonicalRoles(),
  ])

  if (!context) {
    notFound()
  }

  const { workspace, target, preferences, permissions } = context

  // Fetch curriculum, upgrade availability, and potential diff in parallel
  const [curriculum, upgrade] = await Promise.all([
    getWorkspaceCurriculum(workspace.id),
    getAvailableTemplateUpgrade(workspace.id),
  ])

  let upgradeDiff = null
  if (upgrade?.available && target?.templateId) {
    upgradeDiff = await getTemplateVersionDiff(
      target.templateId,
      upgrade.currentVersionNumber,
      upgrade.latestVersionNumber
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Settings Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <WorkspaceAvatar name={workspace.name} id={workspace.id} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {workspace.name}
              </h1>
              <WorkspaceStatusBadge status={workspace.status} />
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Workspace Slug: {workspace.slug} · Timezone: {workspace.timezone}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Interface */}
      <Tabs defaultValue="target" className="space-y-4">
        <TabsList className="bg-surface-elevated/60 border border-border/60 p-1 rounded-xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="target" className="text-xs py-1.5 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground">
            Target
          </TabsTrigger>
          <TabsTrigger value="template" className="text-xs py-1.5 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground">
            Curriculum & Template
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs py-1.5 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground">
            Schedule & Commitment
          </TabsTrigger>
          <TabsTrigger value="general" className="text-xs py-1.5 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground">
            General
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="text-xs py-1.5 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground">
            Lifecycle
          </TabsTrigger>
        </TabsList>

        {/* Tab: Target */}
        <TabsContent value="target" className="space-y-4">
          <TargetEditor
            workspaceId={workspace.id}
            initialTarget={target}
            preferences={preferences}
            canonicalCompanies={canonicalCompanies}
            canonicalRoles={canonicalRoles}
            onSaveAction={updateTargetAction}
            readOnly={!permissions.canEditTarget}
          />
        </TabsContent>

        {/* Tab: Template & Curriculum */}
        <TabsContent value="template" className="space-y-4">
          <CurrentTemplateCard
            curriculum={curriculum}
            upgrade={upgrade}
            upgradeDiff={upgradeDiff}
            workspaceSlug={workspace.slug}
            canEdit={permissions.canEditTarget}
            onUpgradeAction={upgradeTemplateAction}
          />
        </TabsContent>

        {/* Tab: Schedule */}
        <TabsContent value="schedule" className="space-y-4">
          <ScheduleEditor
            workspaceId={workspace.id}
            initialPreferences={preferences}
            onSaveAction={updatePreferencesAction}
            readOnly={!permissions.canEditSchedule}
          />
        </TabsContent>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-4">
          <Card className="border-border/70 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Workspace Overview</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Provenance and identity attributes for this preparation boundary.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Workspace Name</span>
                  <span className="font-semibold text-foreground">{workspace.name}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Workspace Status</span>
                  <span className="font-semibold text-foreground capitalize">{workspace.status}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Timezone</span>
                  <span className="font-semibold text-foreground font-mono">{workspace.timezone}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Created At</span>
                  <span className="font-semibold text-foreground">
                    {new Date(workspace.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Lifecycle */}
        <TabsContent value="lifecycle" className="space-y-4">
          <SettingsLifecycleSection
            workspace={workspace}
            canArchive={permissions.canArchive}
            canRestore={permissions.canRestore}
            archiveAction={archiveWorkspaceAction}
            restoreAction={restoreWorkspaceAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
