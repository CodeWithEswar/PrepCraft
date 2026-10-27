"use client"

import { useState } from "react"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import type { NextWeekBridgeProposal } from "../../types/mock.types"

interface NextWeekBridgeWidgetProps {
  proposal: NextWeekBridgeProposal
  onAddToPlan?: (selectedIds: string[]) => void
}

export function NextWeekBridgeWidget({
  proposal,
  onAddToPlan,
}: NextWeekBridgeWidgetProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    proposal.items.filter((i) => i.selected).map((i) => i.id)
  )

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleAdd = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one task to add to your plan.")
      return
    }
    if (onAddToPlan) {
      onAddToPlan(selectedIds)
    } else {
      toast.success(
        `${selectedIds.length} recommended tasks submitted to Planning Engine.`
      )
    }
  }

  return (
    <div className="pc-side-card" aria-labelledby="bridge-heading">
      <div className="pc-side-card-header">
        <span className="pc-side-card-title flex items-center gap-1.5" id="bridge-heading">
          <AppIcon icon="calendar" size={15} className="text-muted-foreground" />
          Next Week Bridge
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground"
          onClick={handleAdd}
        >
          Add to Plan →
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {proposal.sourceNote}
      </p>

      <div className="pc-bridge-list">
        {proposal.items.map((item) => {
          const isChecked = selectedIds.includes(item.id)
          return (
            <label
              key={item.id}
              className="pc-bridge-item cursor-pointer hover:bg-white/[0.04] transition-colors"
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-0.5"
              />
              <div className="pc-bridge-details">
                <span className="pc-bridge-title">{item.title}</span>
                <span className="pc-bridge-sub">{item.detail}</span>
              </div>
              <span className="pc-bridge-est">~{item.estimatedMinutes}m</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
