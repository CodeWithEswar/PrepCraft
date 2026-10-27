"use client"

import * as React from "react"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { TemplateTypeBadge, VersionBadge } from "./template-badge"
import type { PreparationTemplate, TemplateRecommendation } from "../types/template.types"

interface TemplateCardProps {
  template: PreparationTemplate
  recommendation?: TemplateRecommendation
  isCurrentlyApplied?: boolean
  onPreview: (template: PreparationTemplate) => void
  onSelect: (template: PreparationTemplate) => void
}

export function TemplateCard({
  template,
  recommendation,
  isCurrentlyApplied,
  onPreview,
  onSelect,
}: TemplateCardProps) {
  // Generate clean neutral identity monogram
  const initials = template.shortName
    ? template.shortName.slice(0, 3)
    : template.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 bg-card/80 backdrop-blur-sm ${
        isCurrentlyApplied
          ? "border-[#A15F4B]/60 shadow-[0_0_0_1px_rgba(161,95,75,0.2)]"
          : recommendation?.isStrongMatch
          ? "border-[#A15F4B]/40 hover:border-[#A15F4B]/80 hover:shadow-md"
          : "border-border/70 hover:border-border hover:shadow-sm"
      }`}
    >
      <div className="space-y-4">
        {/* Top Header: Identity Monogram & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated/70 border border-border/80 flex items-center justify-center font-mono font-bold text-xs text-foreground shrink-0 shadow-inner">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">
                  {template.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <TemplateTypeBadge type={template.templateType} />
                <VersionBadge
                  versionNumber={template.currentVersionNumber || 1}
                  isPinned={isCurrentlyApplied}
                />
              </div>
            </div>
          </div>

          {/* Recommended or Currently Applied Status */}
          {isCurrentlyApplied ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#A15F4B] dark:text-[#E2A999] bg-[#A15F4B]/10 px-2 py-0.5 rounded-full border border-[#A15F4B]/30 shrink-0">
              <AppIcon icon="check" size="xs" />
              Active
            </span>
          ) : recommendation?.isStrongMatch ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#A15F4B] dark:text-[#E2A999] bg-[#A15F4B]/10 px-2 py-0.5 rounded-full border border-[#A15F4B]/30 shrink-0">
              <AppIcon icon="sparkles" size="xs" />
              Recommended
            </span>
          ) : null}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {template.description}
        </p>

        {/* Recommendation Reason Callout */}
        {recommendation && (
          <div className="text-[11px] text-muted-foreground bg-surface-elevated/40 border border-border/40 p-2.5 rounded-lg flex items-start gap-1.5">
            <span className="text-[#A15F4B] mt-0.5 shrink-0">
              <AppIcon icon="info" size="xs" />
            </span>
            <span className="line-clamp-2">{recommendation.reason}</span>
          </div>
        )}

        {/* Curriculum Stats */}
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <AppIcon icon="folder" size="xs" />
            <span>{template.trackCount ?? 6} Tracks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AppIcon icon="book" size="xs" />
            <span>{template.topicCount ?? 20} Topics</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border/40">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPreview(template)}
          className="text-xs h-8 px-3 border-border/70 hover:bg-surface-elevated"
        >
          Curriculum Preview
        </Button>

        {isCurrentlyApplied ? (
          <span className="text-[11px] font-mono text-muted-foreground italic">
            Currently Applied
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => onSelect(template)}
            className="text-xs h-8 px-3 bg-[#A15F4B] text-white hover:bg-[#8A503E]"
          >
            Use Template
          </Button>
        )}
      </div>
    </div>
  )
}
