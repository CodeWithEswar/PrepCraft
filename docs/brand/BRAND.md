# PrepCraft

**Craft your way to ready.**

PrepCraft's identity combines monochrome, Smoked Sienna, and mineral glass.
The primary color is **#A15F4B**. Supporting copper colors are material
highlights, not replacements for that anchor.

## Reference and reconstruction

The supplied approved reference is preserved in [reference.png](reference.png).
The hero mark is the construction reference; the smaller pictured variants
contain small differences from their raster rendering. The production system
resolves those into one geometry rather than reproducing inconsistent shapes.

Before construction, the reference was analyzed as follows:

- The visible P is roughly 0.8 times as wide as it is tall. A broad rounded top
  loop carries a warm upper-left highlight and returns around a dark opening.
- The opening has nearly straight top and right edges, rounded right corners,
  and a lower-left transition into the folded return. It stays transparent.
- A smoky mineral surface folds down from the upper left and returns beneath
  the loop. The copper lower ribbon overlaps it, tapers into a rounded toe, and
  turns upward toward the loop. The crossing is the identity's defining fold.
- One four-point craft spark sits optically in the upper opening, never outside
  the P. It is part of the mark, not a repeated decoration.
- The wordmark sits to the right of the symbol with deliberate breathing room.
  `Prep` uses a neutral foreground; `Craft` uses Sienna or a copper highlight on
  a dark surface. App icons reserve a generous margin around the symbol.

The normalized artboard is **512 × 512**. Visible symbol bounds are approximately
x=64–448 and y=16–498. The spark is centered at (286,178). Paths are maintained
only in `src/components/brand/brand-symbol-paths.ts`. React and exported SVGs
consume those paths. The silhouette and opening use an even-odd compound path.
Five simple surfaces communicate crown, mineral return, turn, and lower ribbon;
an edge gradient makes the seams visible without filters or glow.

This is a faithful vector reconstruction, not recovery of the original vectors.
Approximations are explicit:

- The raster's reflections, volumetric lighting, photographic grain, bloom, and
  soft cast shadows are replaced with controlled gradients and fine seams.
- Bézier curves, fold transitions, corner radii, and spark proportions were
  reconstructed by visual comparison. They are not mathematically identical
  to an unavailable original source.
- The original lettering/font is unknown. Standalone wordmarks use outlined
  Geist Regular, tightened by 18 font units, with a 32-unit contour stroke for
  weight. This is a visual approximation rather than a claim of the original
  typeface. Tagline lettering uses regular outlines and wider tracking.
- Flat icons flatten all surfaces into one color and retain the same opening
  and spark. At 16px, the fold is conveyed by the silhouette rather than shading.

## Variants

| Variant | Use |
| --- | --- |
| Dimensional | Large identity placements, app icons, social artwork; 48px or larger |
| Flat | Navigation, footer, dense UI, mobile, small sizes and loading marks |
| Monochrome | Inline SVG/currentColor in any foreground context; print |
| White | Dark, Sienna, or sufficiently controlled photographic backgrounds |
| Black | Bright neutral surfaces |
| Light / dark | Material contrast for the named **surface**, using identical paths |
| Horizontal | Default symbol + wordmark relationship |
| Vertical | Larger centered placements; tagline only at sufficient size |

The default standalone wordmark and lockups target light surfaces. `-dark`
targets dark surfaces. The monochrome SVG uses `currentColor`; an external
`<img>` does not inherit its parent's text color. Inline that variant to control
its color, use `appearance="monochrome"` in React, or select white/black exports.

## Clear space and minimum sizes

Let **u = 48 units**, one eighth of the visible 384-unit symbol width. Reserve
at least u outside the visible symbol or lockup bounds. Never count transparent
artboard padding as additional clear space. The horizontal wordmark begins one
scaled u after the visible right edge of the P (x=448); e.g. x=248 after a .5
symbol scale. React uses the same gap ratio, 48/512 of the symbol box.

| Element | Minimum |
| --- | --- |
| Dimensional symbol | 48 CSS px; 64px preferred on busy surfaces |
| Flat symbol / favicon | 16 CSS px; no hairline seams |
| Horizontal logo | 32px symbol box; approximately 140px total width |
| Vertical logo with tagline | 160px composition size; 224px preferred |

React vertical logos below 160px omit the tagline. Standalone vertical artwork
contains the tagline and must be placed large enough to read. Never shrink it
into a navigation logo. Prefer flat symbols at 16, 20, 24, and 32px.

## Background rules

- **Light:** warm mineral #F3ECE4 with dark foreground and Sienna lettering.
- **Dark:** graphite #171514 with near-white foreground and restrained copper.
- **Photography:** place on a controlled, sufficiently opaque neutral plate.
- **Glass:** keep the underlying scene quiet and the foreground contrast stable.
- **Sienna:** use the white/monochrome mark; avoid Sienna-on-Sienna.

Browser favicons have a **transparent background** so the P sits directly on
the browser tab. The SVG changes foreground with `prefers-color-scheme` and
uses copper as its fallback. PNG/ICO fallbacks are also transparent and use the
SVG's fallback copper. Installed app icons intentionally have rounded mineral
containers. Apple touch artwork is 180px. The maskable icon is fully opaque,
without pre-rounded corners: the platform supplies the crop.

The maskable mark is scaled to .64 inside a 512px tile. Its farthest important
antialiased foreground pixel is approximately 193px from center, inside the
204.8px (40%) safe-circle radius. Circle, squircle, and rounded-square crops are
shown on the inspection page.

## React API and accessibility

```tsx
import { PrepCraftLogo, PrepCraftSymbol, PrepCraftLoader } from "@/components/brand"

<PrepCraftLogo variant="horizontal" appearance="auto" size="md" />
<PrepCraftSymbol variant="flat" size={24} />
<PrepCraftLoader size={48} />
<a href="/" aria-label="PrepCraft home"><PrepCraftLogo decorative /></a>
```

Appearances are `auto`, `light`, `dark`, and `monochrome`. CSS resolves app theme
classes first and falls back to the operating-system preference. No client
theme-detection JavaScript is needed by the mark. Dimensional instances use
React `useId` for every gradient and clipping reference. Wordmarks have no IDs.
Meaningful identities expose one accessible image name; their internal paths
and decorative children do not add announcements. Loaders expose a status name
and stop rotating under `prefers-reduced-motion: reduce`.

Symbol/wordmark/loader sizes accept sm=24, md=32, lg=48, xl=64 or a number.
Horizontal logos use sm=32, md=48, lg=64, xl=96 for the symbol box. Vertical
compositions use sm=160, md=224, lg=288, xl=360.

## Generation and application integration

```sh
npm run brand:generate
npm run brand:validate
npm run typecheck
npm run lint
npm run build
```

Generation requires Node 22.18+ (native TypeScript stripping), installed Next.js
16.4.3 (its bundled fontkit and Geist source), and Sharp. All PNGs and the
multi-resolution favicon ICO derive from SVG sources. SVG export files are
standalone, contain outlined lettering and no raster images, and use local
unique IDs. They are already compact; avoid optimizers that merge fold surfaces
or alter the even-odd opening. Their gradients need no SVG filters.

Next.js root metadata comes from `src/lib/metadata.ts`; theme colors use the
current `viewport` export. `src/app/favicon.ico` uses Next's file convention;
SVG/PNG browser icons, Apple icon, social images, and the manifest are centrally
referenced. Favicon metadata uses a versioned URL after the transparent-background
change to refresh existing browser caches. The manifest uses standalone display,
a dark mineral launch surface, Sienna theme color, and separate `any` and
`maskable` purposes. A manifest is not an offline service worker.

Set `NEXT_PUBLIC_APP_URL` to the real deployed origin for absolute OG/Twitter
URLs. A Vercel production origin is used when supplied by its environment;
otherwise local development falls back to http://localhost:3030. No production
domain has been assumed. This value is resolved at build time.

Visit **/dev/brand** with `npm run dev` to inspect all assets. The route is
noindex and returns 404 in a standard production build. To expose it deliberately
in a preview deployment, set `ENABLE_BRAND_PREVIEW=true` **before building**.
Inspection styles are isolated in `src/app/dev/brand/preview.css`; the app's
global design tokens and shadcn components are untouched.

See [GENERATED-FILES.md](GENERATED-FILES.md) for generated exports,
[FILES.md](FILES.md) for the complete implementation inventory, and
[VALIDATION.md](VALIDATION.md) for verification evidence.

## Incorrect usage

Never stretch, rotate, skew, redraw the P, move the spark, introduce arbitrary
colors or blue/purple gradients, add unrelated symbols, add excessive shadows
or random glow, insert text inside a favicon, or use an insufficient-contrast
background. Do not put app-icon containers behind the browser favicon. Do not
manually edit generated asset paths or create independent shapes for new sizes.

## Typeface attribution

Geist: Copyright 2024 The Geist Project Authors
(https://github.com/vercel/geist-font.git), SIL Open Font License 1.1
(https://openfontlicense.org). No font binary is distributed in public brand
assets; the export script reads the font already supplied by Next.js.
