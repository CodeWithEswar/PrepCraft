import { PrepCraftLoader } from "@/components/brand"

export function PlanningLoadingState({ label = "Loading this week’s plan…" }: { label?: string }) {
  return (
    <div className="pc-plan-card pc-planning-loading" role="status" aria-live="polite">
      <span className="pc-planning-loading-symbol" aria-hidden="true">
        <PrepCraftLoader size={56} decorative />
      </span>
      <div className="pc-planning-loading-copy">
        <p>{label}</p>
        <span>Getting your preparation workspace ready.</span>
      </div>
      <span className="pc-planning-loading-track" aria-hidden="true"><span /></span>
    </div>
  )
}
