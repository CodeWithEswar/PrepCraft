"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppIcon,type AppIconName } from "@/components/app-icon"
import { toast } from "sonner"
import { SimulationBrief } from "./simulation-brief"
import { QuickStart } from "./quick-start"
import { ReadinessOverview } from "./readiness-overview"
import { UpcomingInterviewCard } from "./upcoming-interview-card"
import { RecentMockSessions } from "./recent-mock-sessions"
import { PerformanceInsights } from "./performance-insights"
import { NextWeekBridgeWidget } from "./next-week-bridge-widget"
import { SimulationComposer } from "../composer/simulation-composer"
import { PreFlightDialog } from "../preflight/preflight-dialog"
import type {
  MockHomeData,
  MockMode,
  MockSectionConfig,
  SessionBlueprint,
  SimulationPolicy,
} from "../../types/mock.types"
import { getMockPolicy } from "../../policies/mock-policy-v1"

interface MockHomePageProps {
  data: MockHomeData
  workspaceSlug: string
  onStartSession?: (blueprintId?: string, customConfig?: Omit<import("../../services/session-builder").CreateMockSessionInput["customConfig"] & {}, "mode">) => void
  onOpenReview?: (sessionId: string) => void
}

export function MockHomePage({
  data,
  workspaceSlug,
  onStartSession,
  onOpenReview,
}: MockHomePageProps) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<MockMode>("mixed")

  // Pre-flight dialog state
  const [preFlightOpen, setPreFlightOpen] = useState(false)
  const [selectedBlueprint, setSelectedBlueprint] = useState<SessionBlueprint | null>(
    null
  )
  const [selectedPolicy, setSelectedPolicy] = useState<SimulationPolicy | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const [selectedQuestionsCount, setSelectedQuestionsCount] = useState<number>(6)
  const [isStarting, setIsStarting] = useState(false)

  const handleOpenBlueprint = (blueprint: SessionBlueprint) => {
    setSelectedBlueprint(blueprint)
    setSelectedPolicy(blueprint.policySnapshot)
    setSelectedDuration(blueprint.durationMinutes)
    const count = blueprint.sectionsConfig.reduce((acc, s) => acc + s.count, 0)
    setSelectedQuestionsCount(count)
    setPreFlightOpen(true)
  }

  const handleOpenCustom = (config: {
    title: string
    durationMinutes: number
    difficulty: "easy" | "medium" | "hard" | "mixed"
    sections: MockSectionConfig[]
    pausePolicy: "allowed" | "restricted" | "forbidden"
    navigationPolicy: "free" | "sequential" | "locked"
    hints: boolean
    scratchpad: boolean
    autoSubmit: boolean
  }) => {
    setSelectedBlueprint({
      id: "custom-session",
      version: 1,
      name: config.title,
      description: "Custom tailored preparation session.",
      mode: "custom",
      durationMinutes: config.durationMinutes,
      difficulty: config.difficulty,
      sourceType: "workspace_custom",
      sectionsConfig: config.sections,
      policySnapshot: {
        ...getMockPolicy("custom", config.durationMinutes),
        pausePolicy: config.pausePolicy,
        navigationPolicy: config.navigationPolicy,
        allowScratchpad: config.scratchpad,
        autoSubmit: config.autoSubmit,
      },
      status: "published",
    })
    setSelectedPolicy({
      ...getMockPolicy("custom", config.durationMinutes),
      pausePolicy: config.pausePolicy,
      navigationPolicy: config.navigationPolicy,
      allowScratchpad: config.scratchpad,
      autoSubmit: config.autoSubmit,
    })
    setSelectedDuration(config.durationMinutes)
    setSelectedQuestionsCount(config.sections.reduce((acc, s) => acc + s.count, 0))
    setPreFlightOpen(true)
  }

  const handleConfirmStart = () => {
    setIsStarting(true)
    setTimeout(() => {
      setIsStarting(false)
      setPreFlightOpen(false)
      if (onStartSession) {
        onStartSession(selectedBlueprint?.id)
      } else {
        const dummyId = selectedBlueprint?.id ?? "session-live-1"
        router.push(`/w/${workspaceSlug}/interview/mocks/${dummyId}`)
      }
    }, 600)
  }

  const pills: { mode: MockMode; title: string; sub: string; icon: AppIconName }[] = [
    { mode: "coding", title: "Coding", sub: "DSA & Problem Solving", icon: "code" },
    { mode: "cs_fundamentals", title: "CS Fundamentals", sub: "Java, SQL, OS, Networks", icon: "database" },
    { mode: "behavioral", title: "Behavioral", sub: "STAR & Leadership", icon: "flame" },
    { mode: "project_deep_dive", title: "Project Deep Dive", sub: "Discuss your projects", icon: "folder" },
    { mode: "mixed", title: "Mixed Technical", sub: "Create a custom mix", icon: "target" },
    { mode: "oa", title: "OA Simulator", sub: "Timed assessment", icon: "clock" },
  ]

  return (
    <div className="pc-mock-home">
      {/* Header */}
      <header className="pc-mock-header">
        <div className="pc-mock-title-group">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <span>Interview</span>
            <span>/</span>
            <span className="text-foreground">Mocks</span>
          </div>
          <h1>Mock Interviews & OA Simulator</h1>
          <p>
            Practice in realistic conditions. Build confidence. Turn insights into focused improvement.
          </p>
        </div>

        <div className="pc-mock-quote hidden sm:block">
          &ldquo;Simulate the pressure, so the real interview feels familiar.&rdquo;
        </div>
      </header>

      {/* Pill Bar */}
      <nav className="pc-mock-pill-bar" aria-label="Mock categories">
        {pills.map((pill) => (
          <button
            key={pill.mode}
            type="button"
            className={`pc-mock-pill ${activeCategory === pill.mode ? "is-active" : ""}`}
            onClick={() => {
              setActiveCategory(pill.mode)
              const match = data.blueprints.find((b) => b.mode === pill.mode)
              if (match) handleOpenBlueprint(match)
            }}
          >
            <AppIcon
              icon={pill.icon}
              size={18}
              className={activeCategory === pill.mode ? "text-[#A15F4B]" : "text-muted-foreground"}
            />
            <span className="pc-mock-pill-text">
              <span className="pc-mock-pill-title">{pill.title}</span>
              <span className="pc-mock-pill-sub">{pill.sub}</span>
            </span>
          </button>
        ))}
      </nav>

      {/* Main 2-Column Content */}
      <div className="pc-mock-main-layout">
        {/* Left Column: Hero, Quick Start, Composer, Insights */}
        <div className="pc-mock-left-col">
          <SimulationBrief
            blueprint={data.recommendedBlueprint}
            onStart={handleOpenBlueprint}
            onCustomize={handleOpenBlueprint}
          />

          <QuickStart
            blueprints={data.blueprints}
            onSelect={handleOpenBlueprint}
            onOpenCustom={() => {
              const el = document.getElementById("create-your-mock-heading")
              el?.scrollIntoView({ behavior: "smooth" })
            }}
          />

          <SimulationComposer onStartCustomMock={handleOpenCustom} />

          <PerformanceInsights insights={data.performanceInsights} />
        </div>

        {/* Right Column: Readiness, Upcoming Interview, Recent Sessions, Next Week Bridge */}
        <aside className="pc-mock-right-col" aria-label="Sidebar information">
          <ReadinessOverview
            overallPercentage={data.readiness.overallPercentage}
            dimensions={data.readiness.dimensions}
          />

          <UpcomingInterviewCard interview={data.upcomingInterview} />

          <RecentMockSessions
            workspaceSlug={workspaceSlug}
            sessions={data.recentSessions}
            onOpenReview={onOpenReview}
          />

          <NextWeekBridgeWidget
            proposal={data.nextWeekBridge}
            onAddToPlan={(selectedIds) => {
              toast.success(
                `${selectedIds.length} tasks scheduled with the Planning Engine.`
              )
            }}
          />
        </aside>
      </div>

      {/* Pre-Flight Dialog */}
      <PreFlightDialog
        open={preFlightOpen}
        onOpenChange={setPreFlightOpen}
        blueprint={selectedBlueprint}
        policy={selectedPolicy}
        durationMinutes={selectedDuration}
        totalQuestions={selectedQuestionsCount}
        onConfirmStart={handleConfirmStart}
        isStarting={isStarting}
      />
    </div>
  )
}
