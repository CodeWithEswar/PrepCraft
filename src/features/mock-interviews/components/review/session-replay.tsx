"use client"

import { AppIcon,type AppIconName } from "@/components/app-icon"

interface SessionReplayProps {
  events: {
    timeOffset: string
    label: string
    detail?: string
    icon: string
  }[]
}

export function SessionReplay({ events }: SessionReplayProps) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="session-replay-heading">
      <div className="pc-section-header-row">
        <h3 id="session-replay-heading">Session Replay</h3>
        <span className="text-xs text-muted-foreground">Chronological evidence trail</span>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-3">
        {events.map((ev, idx) => (
          <div key={idx} className="flex items-start gap-3 relative">
            {idx < events.length - 1 && (
              <div className="absolute left-[13px] top-6 bottom-[-12px] w-[1px] bg-white/10" />
            )}

            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 z-10 text-[#A15F4B]">
              <AppIcon icon={ev.icon as AppIconName} size={14} />
            </div>

            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs pt-1">
              <span className="font-semibold text-foreground">{ev.label}</span>
              {ev.detail && (
                <span className="text-muted-foreground text-[11px] sm:text-right">
                  {ev.detail}
                </span>
              )}
            </div>

            <span className="font-mono text-[11px] text-[#A15F4B] shrink-0 pt-1">
              {ev.timeOffset}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
