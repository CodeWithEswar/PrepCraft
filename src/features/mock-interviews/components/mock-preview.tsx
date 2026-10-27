"use client"

import { useState } from "react"
import { MockHomePage } from "./mock-home/mock-home-page"
import { InterviewChamber } from "./chamber/interview-chamber"
import { InterviewDebrief } from "./review/interview-debrief"
import {
  getMockPreviewHomeData,
  getMockPreviewReview,
  getMockPreviewSession,
} from "../services/mock-preview-data"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"

export function MockPreview() {
  const [view, setView] = useState<"home" | "chamber" | "review">("home")
  const homeData = getMockPreviewHomeData()
  const session = getMockPreviewSession()
  const review = getMockPreviewReview()

  return (
    <div className="w-full flex flex-col bg-background text-foreground min-h-screen">
      {/* View Switcher Top Bar: fully responsive & themed */}
      <div className="w-full bg-surface-subtle border-b border-border px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] sm:text-[11px]">
            Preview:
          </span>
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 sm:p-1 rounded-md overflow-x-auto max-w-full">
            <Button
              variant={view === "home" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 sm:h-7 px-2 sm:px-2.5 text-[11px] sm:text-xs whitespace-nowrap"
              onClick={() => setView("home")}
            >
              1. Lobby & Composer
            </Button>
            <Button
              variant={view === "chamber" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 sm:h-7 px-2 sm:px-2.5 text-[11px] sm:text-xs whitespace-nowrap"
              onClick={() => setView("chamber")}
            >
              2. Chamber
            </Button>
            <Button
              variant={view === "review" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 sm:h-7 px-2 sm:px-2.5 text-[11px] sm:text-xs whitespace-nowrap"
              onClick={() => setView("review")}
            >
              3. Debrief
            </Button>
          </div>
        </div>

        <span className="text-[11px] text-[#A15F4B] font-medium hidden md:inline-flex items-center gap-1">
          <AppIcon icon="check" size={13} />
          Phase 16 Engine Active
        </span>
      </div>

      {view === "home" && (
        <div className="w-full flex-1">
          <MockHomePage
            data={homeData}
            workspaceSlug="general-sde-preparation"
            onStartSession={() => setView("chamber")}
            onOpenReview={() => setView("review")}
          />
        </div>
      )}

      {view === "chamber" && (
        <div className="h-[calc(100vh-44px)] overflow-hidden">
          <InterviewChamber
            session={session}
            workspaceSlug="general-sde-preparation"
            onSubmitSession={() => setView("review")}
          />
        </div>
      )}

      {view === "review" && (
        <div className="w-full flex-1">
          <InterviewDebrief
            review={review}
            workspaceSlug="general-sde-preparation"
          />
        </div>
      )}
    </div>
  )
}
