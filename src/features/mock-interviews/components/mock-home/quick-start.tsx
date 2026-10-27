"use client"

import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import type { SessionBlueprint } from "../../types/mock.types"

interface QuickStartProps {
  blueprints: SessionBlueprint[]
  onSelect: (blueprint: SessionBlueprint) => void
  onOpenCustom: () => void
}

export function QuickStart({ blueprints, onSelect, onOpenCustom }: QuickStartProps) {
  return (
    <section className="pc-quick-start-section" aria-labelledby="quick-start-heading">
      <div className="pc-section-header-row">
        <h3 id="quick-start-heading">Quick Start</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={onOpenCustom}
        >
          <span>Custom Mock</span>
          <AppIcon icon="arrow-right" size={14} />
        </Button>
      </div>

      <div className="pc-quick-grid">
        {blueprints.map((bp) => (
          <button
            key={bp.id}
            type="button"
            className="pc-quick-card"
            onClick={() => onSelect(bp)}
          >
            <span className="pc-quick-card-time">{bp.durationMinutes} min</span>
            <span className="pc-quick-card-title">{bp.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
