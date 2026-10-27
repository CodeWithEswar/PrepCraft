import * as React from "react"
import { AppIcon } from "@/components/app-icon"
import type { TemplateRecommendationMatchFactors } from "../types/template.types"

interface TemplateFitProps {
  templateName: string
  reason: string
  isStrongMatch: boolean
  matchFactors?: TemplateRecommendationMatchFactors
  targetContext?: {
    companyName?: string | null
    roleName?: string | null
    interviewLanguage?: string | null
  }
}

export function TemplateFit({
  templateName,
  reason,
  isStrongMatch,
  matchFactors,
  targetContext,
}: TemplateFitProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface-elevated/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#A15F4B]">
            <AppIcon icon="sparkles" size="sm" />
          </span>
          <h4 className="text-xs font-semibold tracking-tight text-foreground uppercase font-mono">
            Why {templateName} fits your workspace
          </h4>
        </div>
        {isStrongMatch && (
          <span className="text-[10px] font-mono text-[#A15F4B] dark:text-[#E2A999] bg-[#A15F4B]/10 px-2 py-0.5 rounded-full border border-[#A15F4B]/20">
            Strong Match
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {reason}
      </p>

      {targetContext && (
        <div className="pt-2 border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
          {targetContext.companyName && (
            <div className="space-y-0.5">
              <span className="text-muted-foreground/70 block text-[10px]">Target Company</span>
              <span className="font-medium text-foreground flex items-center gap-1">
                {matchFactors?.companyMatch && (
                  <span className="text-[#A15F4B]"><AppIcon icon="check" size="xs" /></span>
                )}
                {targetContext.companyName}
              </span>
            </div>
          )}

          {targetContext.roleName && (
            <div className="space-y-0.5">
              <span className="text-muted-foreground/70 block text-[10px]">Target Role</span>
              <span className="font-medium text-foreground flex items-center gap-1">
                {matchFactors?.roleMatch && (
                  <span className="text-[#A15F4B]"><AppIcon icon="check" size="xs" /></span>
                )}
                {targetContext.roleName}
              </span>
            </div>
          )}

          {targetContext.interviewLanguage && (
            <div className="space-y-0.5">
              <span className="text-muted-foreground/70 block text-[10px]">Interview Language</span>
              <span className="font-medium text-foreground capitalize">
                {targetContext.interviewLanguage}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
