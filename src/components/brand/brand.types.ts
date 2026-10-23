import type { CSSProperties } from "react"

export type BrandAppearance = "auto" | "light" | "dark" | "monochrome"
export type BrandSize = "sm" | "md" | "lg" | "xl" | number
export type SymbolVariant = "dimensional" | "flat"

export interface BrandProps {
  appearance?: BrandAppearance
  size?: BrandSize
  /** Identity is announced once; set decorative inside an already named link. */
  decorative?: boolean
  className?: string
  style?: CSSProperties
}

export const symbolSizes = { sm: 24, md: 32, lg: 48, xl: 64 } as const
export const logoSizes = { sm: 32, md: 48, lg: 64, xl: 96 } as const
export const verticalSizes = { sm: 160, md: 224, lg: 288, xl: 360 } as const
export type BrandSizePreset = "sm" | "md" | "lg" | "xl"

export function resolveSize(
  size: BrandSize,
  scale: Record<BrandSizePreset, number> = symbolSizes
): number {
  return typeof size === "number" ? Math.max(1, size) : scale[size]
}
