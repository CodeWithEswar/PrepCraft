import type { CSSProperties } from "react"
export function PrecisionReveal({ lines }: { lines:readonly string[] }) {
  return lines.map((line,i) => <span key={line} className={`mk-precision-line ${i === lines.length - 1 ? "mk-muted-heading" : ""}`} style={{"--line-index":i} as CSSProperties}>{i === lines.length - 1 && line.endsWith("ready.") ? <>{line.slice(0,-6)}<em className="mk-ready-word">ready.</em></> : line}</span>)
}
