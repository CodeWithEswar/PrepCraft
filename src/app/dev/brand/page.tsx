/* Asset inspection only. Production is disabled unless explicitly enabled. */
/* eslint-disable @next/next/no-img-element -- inspect original SVG/PNG files without image transforms */
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { serverEnv } from "@/lib/env/server"
import { PrepCraftLogo, PrepCraftSymbol, PrepCraftWordmark, PrepCraftLoader } from "@/components/brand"
import { ThemeControls } from "./theme-controls"
import "./preview.css"

export const metadata: Metadata = { title: "Brand inspection", robots: { index: false, follow: false } }

export default function BrandPreview() {
  if (process.env.NODE_ENV === "production" && !serverEnv.enableBrandPreview) notFound()

  return (
    <main className={"pc-inspect-page"}>
      <header className={"pc-inspect-header"}>
        <div><p className={"pc-inspect-eyebrow"}>PrepCraft / Identity system</p><h1>Brand inspection</h1><p>Canonical geometry, production exports, and scale checks.</p></div>
        <ThemeControls />
      </header>

      <section className={"pc-inspect-section"} aria-labelledby="construction">
        <h2 id="construction">01 / Symbol & material</h2>
        <div className={"pc-inspect-grid"}>
          <figure className={"pc-inspect-dark"}><PrepCraftSymbol size={200} appearance="dark" /><figcaption>Dimensional · dark mineral</figcaption></figure>
          <figure className={"pc-inspect-light"}><PrepCraftSymbol size={200} appearance="light" /><figcaption>Dimensional · light mineral</figcaption></figure>
          <figure className={"pc-inspect-light"}><PrepCraftSymbol size={200} variant="flat" appearance="light" /><figcaption>Flat · #A15F4B</figcaption></figure>
          <figure className={"pc-inspect-dark"}><PrepCraftSymbol size={200} appearance="monochrome" /><figcaption>Monochrome · currentColor</figcaption></figure>
        </div>
      </section>

      <section className={"pc-inspect-section"} aria-labelledby="lockups">
        <h2 id="lockups">02 / Lockups</h2>
        <div className={"pc-inspect-grid"}>
          <figure className={"pc-inspect-light"}><PrepCraftLogo size="lg" appearance="light" /><figcaption>Horizontal · light</figcaption></figure>
          <figure className={"pc-inspect-dark"}><PrepCraftLogo size="lg" appearance="dark" /><figcaption>Horizontal · dark</figcaption></figure>
          <figure className={"pc-inspect-light"}><PrepCraftLogo variant="vertical" appearance="light" /><figcaption>Vertical · tagline</figcaption></figure>
          <figure className={"pc-inspect-dark"}><PrepCraftLogo variant="vertical" appearance="dark" /><figcaption>Vertical · tagline</figcaption></figure>
        </div>
        <figure className={"pc-inspect-auto"}><PrepCraftWordmark size={56} /><PrepCraftLogo size="md" /><PrepCraftLoader size={64} /><figcaption>Auto appearance · follows application theme</figcaption></figure>
      </section>

      <section className={"pc-inspect-section"} aria-labelledby="scale">
        <h2 id="scale">03 / Native scale</h2>
        <div className={"pc-inspect-scaleGrid"}>
          {(["light", "dark"] as const).map(appearance => <div key={appearance} className={appearance === "light" ? "pc-inspect-light" : "pc-inspect-dark"}>
            <div className={"pc-inspect-scales"}>{[16, 20, 24, 32, 48, 64, 128].map(size => <figure key={size}><PrepCraftSymbol size={size} variant="flat" appearance={appearance} /><figcaption>{size}px</figcaption></figure>)}</div>
          </div>)}
        </div>
        <div className={"pc-inspect-favicons"}>{[16, 32, 48].map(size => <figure key={size}><img alt={`PrepCraft favicon ${size}px`} src={`/brand/favicon/favicon-${size}x${size}.png`} width={size} height={size} /><figcaption>PNG · {size}px</figcaption></figure>)}</div>
      </section>

      <section className={"pc-inspect-section"} aria-labelledby="icons">
        <h2 id="icons">04 / App icons & maskable cropping</h2>
        <div className={"pc-inspect-iconGrid"}>
          {["app-icon-dark", "app-icon-light"].map(name => <figure key={name}><img src={`/brand/app-icons/${name}.svg`} alt={name} width={128} height={128} /><figcaption>{name}</figcaption></figure>)}
          {["circle", "squircle", "rounded"].map(shape => <figure key={shape}><img className={`pc-inspect-${shape}`} src="/brand/app-icons/app-icon-maskable.svg" alt={`Maskable icon cropped to ${shape}`} width={128} height={128} /><figcaption>{shape} crop</figcaption></figure>)}
        </div>
      </section>

      <section className={"pc-inspect-section"} aria-labelledby="motion">
        <h2 id="motion">05 / Loading marks</h2>
        <div className={"pc-inspect-grid"}>
          <figure className={"pc-inspect-light"}><PrepCraftLoader size={96} appearance="light" /><figcaption>React · reduced motion supported</figcaption></figure>
          <figure className={"pc-inspect-dark"}><img src="/brand/loading/loading-ring.svg" width={96} height={96} alt="PrepCraft loading ring" /><figcaption>Standalone SVG · reduced motion supported</figcaption></figure>
        </div>
      </section>

      <section className={"pc-inspect-section"} aria-labelledby="backgrounds">
        <h2 id="backgrounds">06 / Surface contrast</h2>
        <div className={"pc-inspect-grid"}>
          <figure className={"pc-inspect-sienna"}><PrepCraftLogo size="lg" appearance="monochrome" /><figcaption>White · Sienna surface</figcaption></figure>
          <figure className={"pc-inspect-glass"}><PrepCraftLogo size="lg" appearance="dark" /><figcaption>Dark mineral glass · controlled backdrop</figcaption></figure>
        </div>
      </section>

      <section className={"pc-inspect-section"} aria-labelledby="social">
        <h2 id="social">07 / Social exports · 1200 × 630</h2>
        <div className={"pc-inspect-socialGrid"}>{["og-default", "og-dark", "twitter-card"].map(name => <figure key={name}><img src={`/brand/social/${name}.png`} width={1200} height={630} alt={`PrepCraft ${name}`} /><figcaption>{name}.png</figcaption></figure>)}</div>
      </section>
      <footer className={"pc-inspect-footer"}>Inspection only. Not indexed. Production requires ENABLE_BRAND_PREVIEW=true at build time.</footer>
    </main>
  )
}
