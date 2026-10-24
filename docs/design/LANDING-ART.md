# PrepCraft landing and transparent hero artwork

The shipped landing now uses the premium generated `-studio.webp` siblings: five hero renders and ten body illustrations. See `LANDING-STUDIO.md` for their preparation pipeline and `IMPLEMENTATION.md` for current placements. The vector constructions described below are retained source editions; the former centered gallery and Three.js experience have been superseded by the user's Razorpay-inspired page direction.

## Centered hero gallery

The centered editorial hero uses exactly five newly composed primary transparent assets in `public/brand/landing/hero-gallery/`. These are new compositions using the established mineral material language, rather than renamed copies of the earlier landing plates. Every export is **1000 × 800 (5:4)** with generous transparent space for the gallery's restrained transforms.

| Export | Composition | Primary WebP size |
| --- | --- | --- |
| `01-practice.webp` | Wide code plane, reasoning sheet, timer and measured evaluation path | 19.5 KiB |
| `02-patterns.webp` | Irregular structure resolving into an aligned recognizable graph | 18.7 KiB |
| `03-mistakes.webp` | Diagonal attempt with an interrupted branch and corrected path | 16.0 KiB |
| `04-revision.webp` | Retained preparation plane followed by cascading temporal contours | 24.4 KiB |
| `05-readiness.webp` | Six dimensions converging around a balanced folded readiness core | 32.6 KiB |

Together, the canonical primary gallery images are **114,058 bytes (111.4 KiB)**. SVG originals live in `hero-gallery/source/`, and 500 × 400 alpha WebP editions live in `hero-gallery/responsive/`. `hero-gallery/manifest.json` contains alt text, intrinsic dimensions, exact byte sizes and all paths. `hero-gallery/alpha-validation.json` records successful corner/foreground/material alpha checks for all five. `hero-gallery/contact-sheet.png` compares the entire family on warm near-white and graphite backgrounds.

Regenerate only these five assets, without touching previous exports:

```sh
node scripts/generate-landing-art.mjs --gallery-only
```

The full generator also regenerates the gallery. The images are decorative visual support: keep essential preparation concepts as HTML, and use empty alt text for duplicated gallery instances. Reserve the 5:4 ratio in layout, reuse the five canonical paths for loop duplicates, and avoid eagerly loading separate copies of the same asset. Static images require no animation scripts, GPU rendering or font downloads.

Ten original, code-authored vector illustrations express preparation through dimensional mineral structures. No stock imagery, generated characters, company logos, third-party artwork or recreated PrepCraft marks are included. The family uses graphite, nearly neutral mineral surfaces, translucent layers and the canonical Smoked Sienna `#A15F4B` accent. Copper highlights use a small material scale around that anchor.

The cinematic upgrade adds seven dedicated hero assets and true-alpha versions of all ten landing visuals. The transparent files are the preferred delivery assets. Their sources omit the original full-canvas background, rather than attempting to remove a rendered backdrop. Transparent surroundings, semitransparent glass and soft shadows survive WebP encoding.

## Transparent hero

All paths below are relative to `public/brand/landing/hero/`.

| Export | Dimensions | Purpose |
| --- | --- | --- |
| `hero-preparation-core.webp` | 1200 × 1000 | Static progressive-enhancement fallback: an original asymmetric folded ribbon with an open readiness centre |
| `hero-code-layer.webp` | 600 × 600 | A graphite code/practice plane |
| `hero-revision-layer.webp` | 600 × 600 | Layered recurrence intervals |
| `hero-pattern-layer.webp` | 600 × 600 | Branching recognized path |
| `hero-readiness-layer.webp` | 600 × 600 | Aligned thresholds |
| `hero-planner-layer.webp` | 600 × 600 | Structured focus windows |
| `hero-depth-accent.webp` | 600 × 600 | Thin folded mineral / graphite / copper edge |

The central object uses an interlocking graphite front fold, a light mineral return, a translucent rear bridge and a restrained Sienna seam/inner face. It takes inspiration from folded construction without reproducing the official logo or forming a letter. These are original SVG constructions, not images generated with an external model. Hero sources and descriptions are retained in `hero/source/` and `hero/manifest.json`.

## Transparent landing files

Use `public/brand/landing/visuals/` for the ten preferred assets. Names and dimensions match the table below, with the closing visual renamed **`10-ready-state.webp`** as requested in the cinematic specification. The closing composition embeds the exact original hero ribbon at a small stable scale within the readiness threshold, giving the two compositions a visible beginning and resolution. Original full-canvas mineral exports remain at the previous locations for compatibility. Full SVG originals live in `visuals/source/`; responsive 600px-wide alpha exports live in `visuals/responsive/`; `visuals/manifest.json` records their paths, dimensions, alt text and byte sizes.

The final artwork is intentionally text-free: explanatory copy and accessible labels belong in the surrounding HTML. Shapes show questions, thought, practice, mistakes, repetition, readiness and preparation milestones without depicting unimplemented application interfaces.

## Files and recommended placement

All paths below are relative to `public/brand/landing/`.

| Export | Dimensions | Ratio | Recommended placement |
| --- | --- | --- | --- |
| `01-focus-workspace.webp` | 1200 × 750 | 16:10 | Focus / product workspace narrative |
| `02-practice-flow.webp` | 1200 × 750 | 16:10 | Intentional practice and evaluation |
| `03-pattern-thinking.webp` | 1200 × 900 | 4:3 | Pattern recognition |
| `04-mistake-learning.webp` | 1200 × 900 | 4:3 | Mistake journal / learning signals |
| `05-revision-memory.webp` | 1200 × 800 | 3:2 | Revision and retention |
| `06-readiness-path.webp` | 1200 × 800 | 3:2 | Evidence and readiness milestones |
| `07-weekly-planning.webp` | 1200 × 900 | 4:3 | Weekly plan and focus windows |
| `08-project-preparation.webp` | 1200 × 900 | 4:3 | Project explanation and system decisions |
| `09-application-journey.webp` | 1200 × 750 | 16:10 | Application stages and preparation priorities |
| `10-ready-moment.webp` | 1200 × 750 | 16:10 | Closing readiness / final CTA |

Each has a 600px-wide export in `responsive/`, named `NAME-600.webp`. Preserved resolution-independent originals live in `source/NAME.svg`. `manifest.json` provides the dimensions, source links, actual compressed byte counts, responsive dimensions and useful alt text for each image. `contact-sheet.png` is a review artifact; do not load it in the landing page.

## Regeneration

From the repository root:

```sh
node scripts/generate-landing-art.mjs
```

The script uses the existing `sharp` development dependency. It writes all source and delivery assets, manifests, and contact sheets deterministically. WebP quality is 82. Original opaque editions use effort 6; transparent editions use effort 4 and alpha quality 100. Original opaque imagery is approximately 8–20 KiB per 1200px export; alpha editions are larger because the transparency and shadows are retained. No runtime generation, external image request, random seed or network dependency is required.

## Rendering guidance

Use Next.js `Image` with the intrinsic dimensions above and correct responsive `sizes`; prefer native source aspect ratios and `object-fit: contain`. The compositions leave neutral breathing space around the meaningful forms. Avoid aggressive cropping of the readiness portal, branching structures or revision intervals.

Keep below-fold imagery lazy. Use preload only for a genuinely critical hero image; a product interface composition can be the hero instead. The source artwork contains no embedded type, so any narrative labels remain readable HTML. Treat artwork as decorative with `alt=""` when adjacent copy fully explains it. Use the manifest description when the image contributes additional meaning.

Transparent assets should sit directly within page space, without a background rectangle or an invert filter. The original material plates also work in either theme where a plate is intentional. The assets themselves are static: they do not add motion, script weight, backdrop blur or reduced-motion requirements.

## Visual verification

The complete contact sheet and the final readiness export were inspected at generation time. An initial clipped portal and unintended olive cast were corrected. All ten final exports share neutral materials, limited copper details and differentiated compositions. SVG originals remain free of text, logos and external resources.

The transparent upgrade adds `transparent-contact-sheet.png`, compositing every hero and landing asset on near-white and deep graphite for side-by-side inspection. `alpha-validation.json` records a pixel check of every alpha export: all four corners must be alpha zero; transparent, partially transparent and opaque foreground pixels must all be present. The generator fails if any of the 17 assets does not meet those checks. This guards against opaque backgrounds and simulated checkerboards.
