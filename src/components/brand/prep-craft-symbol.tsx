"use client"

import { useId } from "react"
import { SYMBOL_VIEW_BOX, symbolOutline, symbolPaths, symbolGradients } from "./brand-symbol-paths"
import { resolveSize, type BrandProps, type SymbolVariant } from "./brand.types"

export interface PrepCraftSymbolProps extends BrandProps {
  variant?: SymbolVariant
}

export function PrepCraftSymbol({
  variant = "dimensional", appearance = "auto", size = "md",
  decorative = false, className = "", style,
}: PrepCraftSymbolProps) {
  const id = `pc-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const pixels = resolveSize(size)
  const flat = variant === "flat" || appearance === "monochrome"
  const fill = (name: string) => `url(#${id}-${name})`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={SYMBOL_VIEW_BOX}
      width={pixels} height={pixels}
      className={`pc-brand pc-symbol ${className}`}
      data-appearance={appearance}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "PrepCraft"}
      aria-hidden={decorative ? true : undefined}
      focusable="false" style={style}
    >
      {flat ? (
        <g fill={appearance === "monochrome" ? "currentColor" : "var(--brand-flat, #A15F4B)"}>
          <path d={symbolOutline} fillRule="evenodd" />
          <path d={symbolPaths.spark} />
        </g>
      ) : (
        <>
          <defs>
            {symbolGradients.map((gradient) => (
              <linearGradient key={gradient.name} id={`${id}-${gradient.name}`} x1={gradient.x1} y1={gradient.y1} x2={gradient.x2} y2={gradient.y2}>
                {gradient.stops.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />)}
              </linearGradient>
            ))}
            <clipPath id={`${id}-clip`}>
              <path d={symbolOutline} fillRule="evenodd" clipRule="evenodd" />
            </clipPath>
          </defs>
          <g clipPath={fill("clip")}>
            <path d={symbolPaths.silhouette} fill={fill("copper")} />
            <path d={symbolPaths.mineral} fill={fill("mineral")} />
            <path d={symbolPaths.turn} fill={fill("turn")} />
            <path d={symbolPaths.crown} fill={fill("crown")} />
            <path d={symbolPaths.ribbon} fill={fill("ribbon")} />
            <path d={symbolPaths.seams} fill="none" stroke={fill("edge")} strokeWidth="2" strokeLinejoin="round" opacity=".85" />
          </g>
          <path d={symbolOutline} fill="none" fillRule="evenodd" stroke={appearance === "dark" ? fill("edge") : appearance === "light" ? "#855A48" : `var(--brand-edge, ${fill("edge")})`} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={symbolPaths.spark} fill={fill("crown")} />
        </>
      )}
    </svg>
  )
}
