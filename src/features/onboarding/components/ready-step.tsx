"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { format, parseISO, differenceInWeeks, differenceInDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppIcon } from "@/components/app-icon"
import type { ReadyWorkspaceData } from "../types/onboarding.types"

interface ReadyStepProps {
  data: ReadyWorkspaceData
}

export function ReadyStep({ data }: ReadyStepProps) {
  const shouldReduceMotion = useReducedMotion()
  const { workspace, roleName, companyName, targetDate, preferredCodingLanguage, weeklyTargetMinutes, studyDays, plan } = data

  const weeklyHours = Math.round(weeklyTargetMinutes / 60)

  // Target date context if present
  let targetDateContext: string | null = null
  if (targetDate) {
    try {
      const parsed = parseISO(targetDate)
      const formatted = format(parsed, "MMMM d, yyyy")
      const weeks = differenceInWeeks(parsed, new Date())
      const days = differenceInDays(parsed, new Date())
      const relative = weeks >= 2 ? `About ${weeks} weeks away` : `${Math.max(1, days)} days away`
      targetDateContext = `${formatted} (${relative})`
    } catch {
      targetDateContext = targetDate
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Visual Header */}
      <div className="text-center space-y-3">
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center justify-center"
        >
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-[#A15F4B]/10 border border-[#A15F4B]/30 shadow-sm backdrop-blur-md">
            <AppIcon icon="check" size={28} className="text-[#A15F4B]" />
            <span className="absolute -inset-1 rounded-2xl bg-[#A15F4B]/10 blur-sm pointer-events-none -z-10" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Your workspace is ready
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
            PrepCraft has configured{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{workspace.name}</span>{" "}
            around your goals and {weeklyHours}-hour weekly commitment.
          </p>
        </motion.div>
      </div>

      {/* Workspace Configuration Summary */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md p-5 space-y-4 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/60 dark:border-neutral-800/80 pb-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Workspace
            </span>
            <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {workspace.name}
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-mono border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
          >
            /w/{workspace.slug}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-neutral-500 dark:text-neutral-400">Target</div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
              {companyName ? `${companyName} · ` : ""}
              {roleName}
            </div>
          </div>

          <div>
            <div className="text-neutral-500 dark:text-neutral-400">Primary Language</div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100 mt-0.5 capitalize">
              {preferredCodingLanguage === "cpp" ? "C++" : preferredCodingLanguage}
            </div>
          </div>

          <div>
            <div className="text-neutral-500 dark:text-neutral-400">Schedule</div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">
              {weeklyHours}h / week · {studyDays.length} days
            </div>
          </div>

          <div>
            <div className="text-neutral-500 dark:text-neutral-400">Target Date</div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
              {targetDateContext ?? "Flexible"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Week 1 Plan Breakdown */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Your first week
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Based on your {weeklyHours}-hour weekly commitment and role curriculum.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
              {plan.plannedSessions} sessions
            </span>
            <span className="text-xs font-semibold text-[#A15F4B] bg-[#A15F4B]/10 px-2.5 py-1 rounded-md">
              {Math.round(plan.totalWeeklyMinutes / 60)}h planned
            </span>
          </div>
        </div>

        {/* Focus Areas pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {plan.focusAreas.map((area, idx) => (
            <span
              key={area}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                idx === 0
                  ? "border-[#A15F4B]/40 bg-[#A15F4B]/5 text-[#A15F4B] font-medium dark:bg-[#A15F4B]/10"
                  : "border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              {area}
            </span>
          ))}
        </div>
      </motion.div>

      {/* First Up: Starter Tasks for Today */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          First up on Today
        </div>

        <div className="grid gap-2.5">
          {plan.starterItems.map((item, idx) => (
            <div
              key={item.title}
              className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40"
            >
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {item.title}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="secondary"
                  className="text-[11px] font-normal border-neutral-200 dark:border-neutral-800"
                >
                  {item.tag}
                </Badge>
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {item.durationMinutes}m
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Primary Action Button */}
      <motion.div variants={itemVariants} className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800/80">
        <Button
          size="lg"
          nativeButton={false}
          className="w-full bg-[#A15F4B] hover:bg-[#8D5240] text-white shadow-sm font-medium h-12 text-base transition-colors"
          render={
            <Link href={`/w/${workspace.slug}/today`} className="flex items-center justify-center gap-2" />
          }
        >
          <span>Open Today</span>
          <AppIcon icon="arrow-right" size={20} className="text-white" />
        </Button>
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-2.5">
          Today is your daily command center for practice, revisions, and progress tracking.
        </p>
      </motion.div>
    </motion.div>
  )
}
