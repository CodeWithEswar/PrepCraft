"use client"

import { AppIcon } from "@/components/app-icon"
import type { MockSessionItem, MockSessionSection } from "../../types/mock.types"

interface SessionMapProps {
  sections: MockSessionSection[]
  currentItemId: string
  onSelectItem: (item: MockSessionItem) => void
}

export function SessionMap({
  sections,
  currentItemId,
  onSelectItem,
}: SessionMapProps) {

  return (
    <aside className="pc-chamber-nav-sidebar" aria-label="Question Navigator">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Session Map
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground/80 px-2 uppercase tracking-wider">
              {section.title}
            </span>

            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const isCurrent = item.id === currentItemId
                const isFlagged = item.status === "flagged" || item.flaggedAt !== null
                const isAnswered = item.status === "answered"

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors text-left ${
                      isCurrent
                        ? "bg-[var(--pc-mock-sienna)]/20 text-foreground font-semibold border border-[var(--pc-mock-sienna)]/50"
                        : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => onSelectItem(item)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[11px] text-muted-foreground w-4 text-right">
                        {String(item.sortOrder + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {isFlagged && (
                        <AppIcon icon="flag" size={12} className="text-amber-400" />
                      )}
                      {isAnswered && (
                        <AppIcon icon="check" size={12} className="text-emerald-400" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
