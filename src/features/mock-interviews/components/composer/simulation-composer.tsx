"use client"

import { useState } from "react"
import { SectionSelector } from "./section-selector"
import {
  ComposerSettings,
  SettingsConfigurator,
} from "./settings-configurator"
import { SessionPreviewCard } from "./session-preview-card"
import type { MockSectionConfig } from "../../types/mock.types"

interface SimulationComposerProps {
  onStartCustomMock: (customConfig: {
    title: string
    durationMinutes: number
    difficulty: "easy" | "medium" | "hard" | "mixed"
    sections: MockSectionConfig[]
    pausePolicy: "allowed" | "restricted" | "forbidden"
    navigationPolicy: "free" | "sequential" | "locked"
    hints: boolean
    scratchpad: boolean
    autoSubmit: boolean
  }) => void
}

export function SimulationComposer({ onStartCustomMock }: SimulationComposerProps) {
  const [sections, setSections] = useState<MockSectionConfig[]>([
    { type: "coding", title: "Coding (DSA)", count: 2, durationMinutes: 25 },
    { type: "cs_fundamentals", title: "CS Fundamentals", count: 4, durationMinutes: 20 },
    { type: "project_deep_dive", title: "Project Deep Dive", count: 1, durationMinutes: 10 },
  ])

  const [settings, setSettings] = useState<ComposerSettings>({
    durationMinutes: 55,
    difficulty: "mixed",
    pausePolicy: "forbidden",
    navigationPolicy: "free",
    hints: false,
    scratchpad: true,
    autoSubmit: true,
  })

  const totalCalculatedMinutes = sections.reduce(
    (acc, sec) => acc + sec.durationMinutes,
    0
  )

  const handleStart = () => {
    onStartCustomMock({
      title: "Custom Mock Simulation",
      durationMinutes: settings.durationMinutes || totalCalculatedMinutes,
      difficulty: settings.difficulty,
      sections,
      pausePolicy: settings.pausePolicy,
      navigationPolicy: settings.navigationPolicy,
      hints: settings.hints,
      scratchpad: settings.scratchpad,
      autoSubmit: settings.autoSubmit,
    })
  }

  return (
    <section className="pc-composer-wrap" aria-labelledby="create-your-mock-heading">
      <div className="pc-section-header-row">
        <div>
          <h3 id="create-your-mock-heading" className="text-base font-semibold">
            Create Your Mock
          </h3>
          <p className="text-xs text-muted-foreground">
            Build a custom session tailored to your preparation goals.
          </p>
        </div>
      </div>

      <div className="pc-composer-grid">
        <div className="pc-composer-steps">
          <SectionSelector sections={sections} onChange={setSections} />
          <SettingsConfigurator
            settings={settings}
            onChange={setSettings}
            onStartFromTemplate={() => {
              // Preset to balanced mixed technical
              setSections([
                { type: "coding", title: "Coding (DSA)", count: 2, durationMinutes: 25 },
                { type: "cs_fundamentals", title: "CS Fundamentals", count: 3, durationMinutes: 20 },
                { type: "project_deep_dive", title: "Project Deep Dive", count: 1, durationMinutes: 15 },
              ])
              setSettings({
                durationMinutes: 60,
                difficulty: "mixed",
                pausePolicy: "forbidden",
                navigationPolicy: "free",
                hints: false,
                scratchpad: true,
                autoSubmit: true,
              })
            }}
          />
        </div>

        <div>
          <SessionPreviewCard
            totalDurationMinutes={settings.durationMinutes || totalCalculatedMinutes}
            sections={sections}
            onStart={handleStart}
          />
        </div>
      </div>
    </section>
  )
}
