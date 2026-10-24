# Brand validation — 24 October 2026

## Delivery

- Canonical folded-P geometry on a 512-unit artboard, with one transparent
  opening and one craft spark.
- 27 true vector SVGs and 11 SVG-derived PNGs under `public/brand`.
- Dimensional, flat, currentColor, white, black, light/dark, wordmark,
  horizontal, vertical, app, maskable, loading, and social variants.
- Transparent browser favicons at 16/32/48px, responsive SVG, and a generated
  three-resolution Next.js root ICO. Apple touch icon at 180px.
- App and maskable PNGs at 192/512px. Rounded containers remain in app icons.
- Three social compositions at exactly 1200 × 630, each with SVG source.
- TypeScript React logo, symbol, outlined wordmark, and accessible loader.
- Brand-only CSS tokens, central metadata/viewport, and a standalone manifest.
- Brand guide, complete inventory, reproducible scripts, and development-only
  inspection page. No landing page, dashboard, authentication, global design
  token redesign, or shadcn customization was added.

## Checks and evidence

| Check | Result |
| --- | --- |
| `npm run brand:generate` | Pass; 41 generated files including the generation inventory |
| `npm run brand:validate` | Pass; 27 SVGs, 11 sRGB PNGs, 3 ICO entries |
| SVG engineering | XML parses; all have viewBoxes; no text/font dependency, raster embedding, base64, external resources, scripts, unresolved refs, or duplicate IDs within an asset |
| Canonical construction | All symbol-bearing exports contain the shared silhouette |
| PNG dimensions / color | Exact requested dimensions; sRGB |
| Favicon background | PNG corner alpha=0; ICO contains those same transparent PNGs; SVG has no container |
| Small-size review | Native 16/20/24/32/48/64/128px inspected; P and opening recognizable; spark reduces to a small glint at 16px |
| Light/dark review | Both materials and flat variants visually inspected on warm mineral, graphite, Sienna, and controlled mineral glass |
| Maskable crop | Circle, squircle, rounded square inspected; foreground max radius 192.9px < safe radius 204.8px |
| React SVG IDs | Browser check passes for unique IDs and resolved gradient/clip references with many instances |
| Theme behavior | Dark/light class overrides and automatic OS preference pass, including explicit light over OS dark |
| Reduced motion | Browser check confirms loader animation-name is none |
| Browser runtime | No page errors during brand inspection |
| Mobile | 390 × 844 viewport; no horizontal document overflow |
| Metadata / manifest | Browser validates application name, OG/Twitter URLs, two theme colors, manifest, and reachable icons |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run test` | Pass; 1 file, 3 existing tests |
| `PLAYWRIGHT_CHANNEL=chrome npx playwright test e2e/brand.spec.ts e2e/smoke.spec.ts` | Pass; 3 tests |
| `npm run build` | Pass; Next.js 16.4.3 Turbopack production compilation, type checking, and static generation |
| `node scripts/check-brand-production.mjs http://localhost:3031` | Pass; root/metadata/assets reachable, manifest icons reachable, /dev/brand returns HTTP 404 |

The first sandbox build failed to initialize a CSS worker. A retry with its
failed generated production cache removed passed; no application or compiler
configuration workaround was required. The inspection page uses scoped plain
CSS because this project's existing CSS-loader rule did not retain its module
styling during visual review. That styling was corrected and browser-checked.

Installed Chrome was used through Playwright because this environment does not
have the Playwright version's default Chromium download. To reproduce with an
installed browser, set `PLAYWRIGHT_CHANNEL=chrome`; omit it with the normal
Playwright Chromium installation.

## Visual review artifacts

- [Approved reference](reference.png)
- [Master on light and dark](master-review.png)
- [Transparent favicon at native and enlarged sizes on three tab colors](favicon-review.png)
- [Desktop inspection](preview-desktop.png)
- [Mobile inspection](preview-mobile.png)
- [Default social image](../../public/brand/social/og-default.png)
- [Dark social image](../../public/brand/social/og-dark.png)

The 16px PNG is enlarged with nearest-neighbor interpolation on the review
sheet so antialiased boundaries and transparent negative space can be inspected.
Production favicons remain at their native dimensions.

## Approximations and deployment configuration

The curves, radii, and spark were reconstructed by eye from the raster source.
Photographic reflections/lighting were simplified into gradients and seams.
The original typeface is unknown; exported lettering is outlined Geist Regular
with a documented contour weight adjustment. The guide details these limits;
no pixel-perfect recovery is claimed.

Set `NEXT_PUBLIC_APP_URL` to the deployed origin before the deployment build.
The default production preview route is blocked; enabling it deliberately needs
`ENABLE_BRAND_PREVIEW=true` at build time. No deployment was performed.
