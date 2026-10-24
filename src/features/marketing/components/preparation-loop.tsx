import { AppIcon } from "@/components/app-icon"

export function PreparationLoop() {
  return <section className="mk-loop container-page" aria-label="The preparation loop"><p>Less scattered effort.<br /><strong>More connected progress.</strong></p><ol>{["Plan", "Practice", "Revise", "Track", "Improve", "Get ready"].map((step, i) => <li key={step}><span className="type-mono">0{i + 1}</span><strong>{step}</strong>{i < 5 && <AppIcon icon="arrow-right" size={14} />}</li>)}</ol></section>
}
