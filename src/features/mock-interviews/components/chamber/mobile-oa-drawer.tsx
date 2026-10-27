"use client"

import { AppIcon } from "@/components/app-icon"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { MockSessionItem, MockSessionSection } from "../../types/mock.types"

interface MobileOADrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: MockSessionSection[]
  currentItemId: string
  onSelectItem: (item: MockSessionItem) => void
}

export function MobileOADrawer({
  open,
  onOpenChange,
  sections,
  currentItemId,
  onSelectItem,
}: MobileOADrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-t border-border text-card-foreground max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
            <AppIcon icon="menu" size={16} />
            Question Navigator
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </span>

              <div className="grid grid-cols-1 gap-1.5">
                {section.items.map((item) => {
                  const isCurrent = item.id === currentItemId
                  const isFlagged = item.status === "flagged" || item.flaggedAt !== null
                  const isAnswered = item.status === "answered"

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`flex items-center justify-between p-3 rounded-lg text-xs transition-colors text-left ${
                        isCurrent
                          ? "bg-[var(--pc-mock-sienna)]/20 text-foreground font-semibold border border-[var(--pc-mock-sienna)]/50"
                          : "bg-surface-subtle text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                      }`}
                      onClick={() => {
                        onSelectItem(item)
                        onOpenChange(false)
                      }}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="font-mono text-xs text-muted-foreground w-5">
                          {String(item.sortOrder + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate">{item.title}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isFlagged && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                            <AppIcon icon="flag" size={12} />
                            Flagged
                          </span>
                        )}
                        {isAnswered && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <AppIcon icon="check" size={12} />
                            Answered
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
