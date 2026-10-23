import { PrepCraftSymbol } from "./prep-craft-symbol"
import { resolveSize, type BrandProps } from "./brand.types"

export function PrepCraftLoader({ appearance = "auto", size = "lg", decorative = false, className = "", style }: BrandProps) {
  const pixels = resolveSize(size)
  return (
    <span className={`pc-brand pc-loader ${className}`} data-appearance={appearance}
      role={decorative ? undefined : "status"} aria-label={decorative ? undefined : "Loading PrepCraft"}
      aria-hidden={decorative ? true : undefined} style={{ ...style, width: pixels, height: pixels }}>
      <svg viewBox="0 0 512 512" aria-hidden="true" className="pc-loader-ring" focusable="false">
        <circle cx="256" cy="256" r="231" fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth="10" />
        <circle className="pc-loader-orbit" cx="256" cy="256" r="231" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray="360 1092" />
      </svg>
      <PrepCraftSymbol variant="flat" appearance={appearance} size={pixels * .56} decorative />
    </span>
  )
}
