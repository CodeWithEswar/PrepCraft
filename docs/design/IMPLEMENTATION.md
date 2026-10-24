# PrepCraft landing implementation

## Shipped direction

The user's latest direction applies Razorpay's landing-page composition and scrolling approach to PrepCraft, retaining Smoked Sienna and the established logo. The live reference was inspected at https://razorpay.com/ on October 24, 2026, including its hero, discovery bar, category rail, stacking product panels, horizontal cards, audience tabs, editorial cards, dark developer section, FAQ and closing CTA/footer.

The implementation adapts those structural patterns with original PrepCraft content and artwork. No Razorpay assets, product copy, customer claims, logos or source code were copied into the application.

## Page architecture

`src/app/(marketing)/page.tsx` composes:

1. A truthful preview announcement and sticky brand/navigation header.
2. A wide split hero: editorial copy and shadcn CTAs on the left, one complete studio illustration on the right, five-image rotation controls and a discovery bar.
3. A moving subject strip and graphite spotlight banner.
4. Six product panels: Practice, Patterns, Mistakes, Revision, Readiness and Interviews. The panels stack during desktop scrolling; their category rail remains available. Cards have real section links and a horizontally scrollable track on narrower screens.
5. Three preparation-stage tabs with distinct guidance and matching artwork.
6. Two editorial learning statements.
7. A graphite practice section with working Attempt/Reflection/Revision tabs and a local lesson-review interaction.
8. A readiness-evidence panel, project/interview narrative and illustrative preparation timeline.
9. A centered FAQ with individually bordered accordion rows, final preparation CTA and compact grouped footer.

The previous centered gallery and central Three.js experiment have been replaced in response to later user steering. The final experience has no canvas, global cursor effect or forced scroll handler.

## Main files

| File | Purpose |
| --- | --- |
| `src/app/globals.css` | Semantic light/dark tokens, containers, typography, glass and accessibility defaults |
| `src/styles/ui.css` | Shared shadcn component skin |
| `src/features/marketing/content/landing-content.ts` | Navigation, hero and FAQ copy |
| `src/features/marketing/content/product-suite.ts` | Six preparation categories and eighteen feature cards |
| `src/features/marketing/components/hero.tsx` | Hero copy, CTAs and discovery navigation |
| `src/features/marketing/components/hero/hero-visual-world.tsx` | Five-scene slideshow, visibility/pause controls |
| `src/features/marketing/components/hero/hero.css` | Hero layout and responsive composition |
| `src/features/marketing/components/product-suite.tsx` | Sticky category rail, stacking panels and card tracks |
| `src/features/marketing/components/platform-sections.tsx` | Topic ticker, spotlight, preparation-stage tabs and editorial content |
| `src/features/marketing/platform.css` | Razorpay-inspired layout and scroll treatment |
| `src/features/marketing/components/product-sections.tsx` | Practice, readiness and project sections |
| `src/features/marketing/components/closing.tsx` | Timeline, FAQ, closing CTA and footer |
| `src/features/marketing/motion/` | Pointer, reveal, focus and evidence motion helpers |
| `tests/e2e/marketing.spec.ts` | Responsive, navigation, stack, tabs, slideshow, no-JS and no-WebGL checks |

## Artwork and provenance

All fifteen premium studio illustrations were created with the built-in `image_gen` tool. Prompt sets, source PNGs and delivery manifests are retained locally. Transparent WebP delivery files are versioned siblings; the earlier code-authored vector sources remain available.

Hero files, all 1000 × 800, in `public/brand/landing/hero-gallery/`:

| File | Size |
| --- | --- |
| `01-practice-studio.webp` | 132.5 KiB |
| `02-patterns-studio.webp` | 109.5 KiB |
| `03-mistakes-studio.webp` | 94.2 KiB |
| `04-revision-studio.webp` | 134.6 KiB |
| `05-readiness-studio.webp` | 135.1 KiB |

The five primary hero exports total approximately 606 KiB before responsive Next.js optimization. Only the first scene is preloaded. Their prompts are in `docs/design/hero-studio-prompts.json`; PNG masters and a light/dark contact sheet are in `docs/design/hero-gallery/`.

Body files in `public/brand/landing/visuals/`:

| File | Dimensions | Size | Main placement |
| --- | --- | --- | --- |
| `01-focus-workspace-studio.webp` | 1200 × 750 | 150.0 KiB | Preparation history / connected workspace |
| `02-practice-flow-studio.webp` | 1200 × 750 | 140.8 KiB | Session structure and deliberate practice |
| `03-pattern-thinking-studio.webp` | 1200 × 900 | 150.9 KiB | Pattern recognition / fundamentals |
| `04-mistake-learning-studio.webp` | 1200 × 900 | 108.6 KiB | Mistakes and reflection |
| `05-revision-memory-studio.webp` | 1200 × 800 | 148.0 KiB | Revision, retention and preparation history |
| `06-readiness-path-studio.webp` | 1200 × 800 | 117.5 KiB | Readiness priorities |
| `07-weekly-planning-studio.webp` | 1200 × 900 | 155.9 KiB | Weekly and daily planning |
| `08-project-preparation-studio.webp` | 1200 × 900 | 191.5 KiB | Projects and architectural trade-offs |
| `09-application-journey-studio.webp` | 1200 × 750 | 103.7 KiB | Behavioral / application preparation |
| `10-ready-state-studio.webp` | 1200 × 750 | 113.5 KiB | Final readiness / closing CTA |

The body exports total approximately 1.35 MiB before responsive optimization. Below-fold images are lazy loaded, use intrinsic dimensions, preserve their alpha, and remain text-free. Hero images have 500px source variants; body images have 600px variants. Next.js Image selects responsive delivery sizes in the page.

`docs/design/landing-studio-prompts.json` contains all ten body prompts. `docs/design/landing-studio/masters/` retains generated PNGs; `contact-sheet.png` compares white and graphite backgrounds. The preparation scripts validate true transparency and exact dimensions for primary and responsive files.

Commands:

```sh
npm run landing:studio
npm run landing:studio:body
npm run landing:validate
npm run brand:validate
```

## Validation and boundaries

Final validation results are recorded in [VALIDATION.md](./VALIDATION.md), with screenshots in this directory. `MARKETING-AUDIT.json` records a local browser accessibility/performance run; it is not a field Core Web Vitals report. The browser matrix uses installed Chrome and Edge, plus Playwright Firefox and WebKit. WebKit is an engine proxy on Windows, not a physical Safari/iPhone test.

The implemented scope remains marketing, shared design primitives and browser-local previews. Authentication, saved dashboards, backend persistence, payments and public deployment are outside this implementation.
