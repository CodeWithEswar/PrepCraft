import { PrepCraftSymbol } from "./prep-craft-symbol"
import { PrepCraftWordmark } from "./prep-craft-wordmark"
import { logoSizes, resolveSize, verticalSizes, type BrandProps } from "./brand.types"

export interface PrepCraftLogoProps extends BrandProps {
  variant?: "horizontal" | "vertical"
}

export function PrepCraftLogo({ variant = "horizontal", appearance = "auto", size = "md", decorative = false, className = "", style }: PrepCraftLogoProps) {
  const vertical = variant === "vertical"
  const pixels = resolveSize(size, vertical ? verticalSizes : logoSizes)
  const symbolSize = vertical ? pixels * .48 : pixels
  return (
    <span
      className={`pc-brand pc-logo pc-logo-${variant} ${className}`} data-appearance={appearance}
      style={{ ...style, "--pc-logo-size": `${pixels}px` } as React.CSSProperties}
      role={decorative ? undefined : "img"} aria-label={decorative ? undefined : "PrepCraft"}
      aria-hidden={decorative ? true : undefined}
    >
      <PrepCraftSymbol size={symbolSize} appearance={appearance} decorative />
      <span className="pc-logo-lettering">
        <PrepCraftWordmark size={vertical ? pixels * .21 : pixels * .68} appearance={appearance} decorative />
        {vertical && pixels >= 160 && <span className="pc-tagline">Craft your way to ready.</span>}
      </span>
    </span>
  )
}
