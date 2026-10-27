"use client"

import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import type { MockSectionConfig } from "../../types/mock.types"

interface SectionSelectorProps {
  sections: MockSectionConfig[]
  onChange: (sections: MockSectionConfig[]) => void
}

export function SectionSelector({ sections, onChange }: SectionSelectorProps) {
  const handleRemove = (index: number) => {
    if (sections.length <= 1) return
    const updated = sections.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleAdd = () => {
    onChange([
      ...sections,
      {
        type: "cs_fundamentals",
        title: "CS Fundamentals",
        count: 2,
        durationMinutes: 15,
      },
    ])
  }

  return (
    <div className="pc-composer-step-block">
      <div className="pc-step-label">
        <span className="pc-step-number">1</span>
        <span>Select Sections</span>
      </div>

      <div className="pc-composer-sections-list">
        {sections.map((sec, idx) => (
          <div key={idx} className="pc-composer-section-row">
            <div className="pc-composer-section-info">
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
                size={16}
                className="text-[#A15F4B]"
              />
              <span>{sec.title}</span>
            </div>

            <div className="pc-composer-section-meta">
              <span>{sec.count} question{sec.count > 1 ? "s" : ""}</span>
              <span>{sec.durationMinutes} min</span>
              {sections.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remove ${sec.title}`}
                  className="text-muted-foreground hover:text-foreground ml-1"
                  onClick={() => handleRemove(idx)}
                >
                  <AppIcon icon="close" size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="self-start text-xs mt-1"
        onClick={handleAdd}
      >
        <AppIcon icon="plus" size={14} />
        <span>Add Section</span>
      </Button>
    </div>
  )
}
