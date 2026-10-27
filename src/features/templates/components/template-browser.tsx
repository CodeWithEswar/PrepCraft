"use client"

import * as React from "react"
import { AppIcon } from "@/components/app-icon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { TemplateCard } from "./template-card"
import { TemplateDetailView } from "./template-detail"
import { ApplyTemplateDialog } from "./apply-template-dialog"
import type {
  PreparationTemplate,
  TemplateRecommendation,
  TemplateDetail,
} from "../types/template.types"
import type { ActionResult } from "../server/mutations"
import type { ApplyTemplateInput } from "../schemas/template.schema"

interface TemplateBrowserProps {
  templates: PreparationTemplate[]
  recommendations: TemplateRecommendation[]
  workspaceId: string
  currentTemplateId?: string | null
  currentTemplateName?: string | null
  targetContext?: {
    companyName?: string | null
    roleName?: string | null
    interviewLanguage?: string | null
  }
  templateDetailsMap: Record<string, TemplateDetail>
  onApplyAction?: (input: ApplyTemplateInput) => Promise<ActionResult<{ appliedVersionNumber: number }>>
}

export function TemplateBrowser({
  templates,
  recommendations,
  workspaceId,
  currentTemplateId,
  currentTemplateName,
  targetContext,
  templateDetailsMap,
  onApplyAction,
}: TemplateBrowserProps) {
  const [search, setSearch] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
  const [previewTemplate, setPreviewTemplate] = React.useState<PreparationTemplate | null>(null)
  const [applyTemplate, setApplyTemplate] = React.useState<PreparationTemplate | null>(null)

  // Map recommendations by template id for quick lookup
  const recMap = React.useMemo(() => {
    const map = new Map<string, TemplateRecommendation>()
    for (const rec of recommendations) {
      map.set(rec.template.id, rec)
    }
    return map
  }, [recommendations])

  // Filter templates based on category and search
  const filteredTemplates = React.useMemo(() => {
    return templates.filter((t) => {
      // Category filter
      if (selectedCategory === "recommended") {
        const rec = recMap.get(t.id)
        if (!rec || !rec.isStrongMatch) return false
      } else if (selectedCategory === "company") {
        if (t.templateType !== "company" && t.templateType !== "company_role") return false
      } else if (selectedCategory === "role") {
        if (t.templateType !== "role") return false
      } else if (selectedCategory === "general") {
        if (t.templateType !== "general") return false
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesName = t.name.toLowerCase().includes(q)
        const matchesDesc = t.description.toLowerCase().includes(q)
        const matchesType = t.templateType.toLowerCase().includes(q)
        const matchesSlug = t.slug.toLowerCase().includes(q)
        return matchesName || matchesDesc || matchesType || matchesSlug
      }

      return true
    })
  }, [templates, selectedCategory, search, recMap])

  const previewDetail = previewTemplate ? templateDetailsMap[previewTemplate.id] : null

  return (
    <div className="space-y-6">
      {/* Catalog Header */}
      <div className="space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Choose your preparation structure
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Start with a proven, company-curated or role-aligned curriculum and adapt it to your target as your preparation progresses.
        </p>
      </div>

      {/* Controls: Search and Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <AppIcon icon="search" size="sm" />
          </span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by company, role, or tracks..."
            className="pl-9 h-9 text-xs bg-card/80 border-border/70 rounded-xl"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <AppIcon icon="close" size="xs" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="shrink-0"
        >
          <TabsList className="bg-surface-elevated/60 border border-border/60 p-1 rounded-xl h-9 flex gap-1">
            <TabsTrigger value="all" className="text-xs py-1 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground">
              All
            </TabsTrigger>
            <TabsTrigger value="recommended" className="text-xs py-1 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground">
              Recommended
            </TabsTrigger>
            <TabsTrigger value="company" className="text-xs py-1 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground">
              Company
            </TabsTrigger>
            <TabsTrigger value="role" className="text-xs py-1 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground">
              Role
            </TabsTrigger>
            <TabsTrigger value="general" className="text-xs py-1 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground">
              General
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center space-y-3 bg-surface-elevated/20">
          <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-muted-foreground">
            <AppIcon icon="info" size="sm" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              No preparation templates found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No templates match your search criteria. Try clearing filters or use the General Software Engineer curriculum.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("")
              setSelectedCategory("all")
            }}
            className="text-xs"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => {
            const isCurrentlyApplied =
              currentTemplateId === template.id || currentTemplateName === template.name
            return (
              <TemplateCard
                key={template.id}
                template={template}
                recommendation={recMap.get(template.id)}
                isCurrentlyApplied={isCurrentlyApplied}
                onPreview={(tmpl) => setPreviewTemplate(tmpl)}
                onSelect={(tmpl) => setApplyTemplate(tmpl)}
              />
            )
          })}
        </div>
      )}

      {/* Detailed Curriculum Preview Sheet */}
      <Sheet open={Boolean(previewTemplate)} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-6">
          <SheetHeader className="pb-4 border-b border-border/50">
            <SheetTitle className="text-lg font-bold">
              Curriculum Specification
            </SheetTitle>
          </SheetHeader>

          {previewDetail ? (
            <div className="py-4">
              <TemplateDetailView
                detail={previewDetail}
                workspaceId={workspaceId}
                currentTemplateName={currentTemplateName}
                recommendation={previewTemplate ? recMap.get(previewTemplate.id) : null}
                targetContext={targetContext}
                onApplyAction={onApplyAction}
                onClose={() => setPreviewTemplate(null)}
                onApplied={() => {
                  setPreviewTemplate(null)
                }}
              />
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Loading curriculum details...
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Application Dialog */}
      {applyTemplate && (
        <ApplyTemplateDialog
          open={Boolean(applyTemplate)}
          onOpenChange={(open) => !open && setApplyTemplate(null)}
          workspaceId={workspaceId}
          template={applyTemplate}
          currentTemplateName={currentTemplateName}
          onApplyAction={onApplyAction}
          onSuccess={() => setApplyTemplate(null)}
        />
      )}
    </div>
  )
}
