"use client"

import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import type { SessionBlueprint } from "../../types/mock.types"

interface SimulationBriefProps {
  blueprint: SessionBlueprint
  onStart: (blueprint: SessionBlueprint) => void
  onCustomize: (blueprint: SessionBlueprint) => void
}

export function SimulationBrief({ blueprint, onStart, onCustomize }: SimulationBriefProps) {
  return (
    <section className="pc-hero-brief" aria-labelledby="recommended-simulation-heading">
      <div className="pc-hero-tag">Recommended for You</div>
      <h2 className="pc-hero-title" id="recommended-simulation-heading">
        {blueprint.name}
      </h2>

      <div className="pc-hero-meta">
        {blueprint.sectionsConfig.map((sec) => (
          <span key={sec.title} className="pc-hero-chip">
            <AppIcon
              icon={
                sec.type === "coding"
                  ? "code"
                  : sec.type === "project_deep_dive"
                  ? "folder"
                  : sec.type === "behavioral"
                  ? "flame"
                  : "book"
              }
              size={14}
            />
            {sec.title} × {sec.count}
          </span>
        ))}
        <span className="pc-hero-chip">
          <AppIcon icon="clock" size={14} />
          {blueprint.durationMinutes} minutes
        </span>
        <span className="pc-hero-chip">
          <AppIcon icon="target" size={14} />
          {blueprint.difficulty === "mixed" ? "Medium → Hard" : blueprint.difficulty}
        </span>
      </div>

      <div className="pc-hero-content-split">
        <div className="pc-hero-why">
          <h4>Why this mock?</h4>
          <ul>
            {blueprint.whyRecommended?.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pc-hero-actions">
        <Button
          size="lg"
          className="pc-btn-sienna"
          onClick={() => onStart(blueprint)}
        >
          <span>Start Mock</span>
          <AppIcon icon="arrow-right" size={16} />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => onCustomize(blueprint)}
        >
          <AppIcon icon="settings" size={16} />
          <span>Customize</span>
        </Button>
        <Button variant="ghost" size="lg">
          <AppIcon icon="bookmark" size={16} />
          <span>Save for later</span>
        </Button>
      </div>
    </section>
  )
}
