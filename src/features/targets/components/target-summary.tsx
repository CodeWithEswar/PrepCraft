import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppIcon } from "@/components/app-icon"
import type { TargetDetails, ScheduleDetails } from "../types/target.types"
import { differenceInDays, differenceInWeeks, parseISO } from "date-fns"

interface TargetSummaryProps {
  target: TargetDetails | null
  preferences: ScheduleDetails | null
}

const PREPARATION_LEVEL_LABELS = {
  foundation: "Foundation (Core Concepts)",
  developing: "Developing (Consistent Practice)",
  interview_preparation: "Interview Preparation (Timed & Mock)",
}

const LANGUAGE_LABELS = {
  java: "Java",
  python: "Python",
  cpp: "C++",
  javascript_typescript: "JavaScript / TypeScript",
  other: "Other",
}

export function TargetSummary({ target, preferences }: TargetSummaryProps) {
  const companyName = target?.companyName || target?.customCompanyName || "General Preparation"
  const roleName = target?.roleName || "Software Engineer"
  const language = target?.interviewLanguage ? LANGUAGE_LABELS[target.interviewLanguage] || target.interviewLanguage : "Java"
  const level = target?.preparationLevel ? PREPARATION_LEVEL_LABELS[target.preparationLevel] || target.preparationLevel : "Developing"

  let dateText = "No target date set (open-ended)"
  if (target?.targetDate) {
    const parsed = parseISO(target.targetDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (!isNaN(parsed.getTime())) {
      const days = differenceInDays(parsed, today)
      const weeks = differenceInWeeks(parsed, today)
      dateText = `${target.targetDate} (${days} days · ~${weeks} weeks remaining)`
    }
  }

  const weeklyHours = preferences
    ? (preferences.weeklyTargetMinutes / 60).toFixed(1).replace(/\.0$/, "") + " hrs/week"
    : "10 hrs/week"

  return (
    <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Career Target
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              {companyName} · {roleName}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-xs bg-surface-elevated/40 border-border/70">
              {language}
            </Badge>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {weeklyHours}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground block text-[11px]">Preparation Stage</span>
            <span className="font-medium text-foreground">{level}</span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground block text-[11px]">Interview Target Horizon</span>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <AppIcon icon="calendar" size="xs" className="text-primary" />
              <span>{dateText}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
