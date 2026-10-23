import paths from "./brand-wordmark-paths.json"
import { resolveSize, type BrandProps } from "./brand.types"

export function PrepCraftWordmark({ appearance = "auto", size = "md", decorative = false, className = "", style }: BrandProps) {
  const pixels = resolveSize(size)
  const { word } = paths
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`-24 -24 ${word.width + 48} ${word.capHeight + 310}`}
      width={pixels * (word.width + 48) / (word.capHeight + 310)} height={pixels}
      className={`pc-brand pc-wordmark ${className}`} data-appearance={appearance}
      role={decorative ? undefined : "img"} aria-label={decorative ? undefined : "PrepCraft"}
      aria-hidden={decorative ? true : undefined} focusable="false" style={style}
    >
      <g transform={`translate(0 ${word.capHeight}) scale(1 -1)`} strokeWidth={word.stroke} strokeLinejoin="round">
        {word.paths.map((glyph, index) => (
          <path key={index} d={glyph.d} transform={`translate(${glyph.x} ${glyph.y})`} fill={glyph.craft ? "var(--brand-word-accent, #A15F4B)" : "var(--brand-word, #171514)"} stroke={glyph.craft ? "var(--brand-word-accent, #A15F4B)" : "var(--brand-word, #171514)"} />
        ))}
      </g>
    </svg>
  )
}
