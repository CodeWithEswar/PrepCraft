# Premium studio landing artwork

The landing studio pipeline prepares ten generated illustrations in the same graphite, mineral-glass and Smoked Sienna material family as the premium hero renders. The source PNGs retain the actual generated artwork; this pipeline resizes and encodes them without recolouring, flattening or replacing their alpha channel.

## Source manifest

`docs/design/landing-studio-prompts.json` is the input. It records a top-level `mode` and ten `assets` entries. Every entry must contain `name`, `width`, `height`, `prompt` and the completed PNG's `generatedPath`. Requested output dimensions determine the exact target ratio; source artwork is contained within that ratio without cropping.

Expected subject names and established landing ratios are:

| Subject stem | Width × height | Ratio |
| --- | --- | --- |
| `01-focus-workspace` | 1200 × 750 | 16:10 |
| `02-practice-flow` | 1200 × 750 | 16:10 |
| `03-pattern-thinking` | 1200 × 900 | 4:3 |
| `04-mistake-learning` | 1200 × 900 | 4:3 |
| `05-revision-memory` | 1200 × 800 | 3:2 |
| `06-readiness-path` | 1200 × 800 | 3:2 |
| `07-weekly-planning` | 1200 × 900 | 4:3 |
| `08-project-preparation` | 1200 × 900 | 4:3 |
| `09-application-journey` | 1200 × 750 | 16:10 |
| `10-ready-state` | 1200 × 750 | 16:10 |

The prompt manifest is authoritative if different dimensions are explicitly requested. Filename stems can include the `-studio` suffix already; the pipeline appends that suffix only once.

## Preparation

After all ten image generations finish and their paths are recorded, run from the repository root:

```sh
node scripts/prepare-landing-studio.mjs
```

The script preflights every input before producing derivatives. It preserves each source under `docs/design/landing-studio/masters/NAME.png`, copying it only when that master does not already exist. Rerunning uses the preserved master.

Delivery files are non-destructive siblings in `public/brand/landing/visuals/NAME-studio.webp`. Existing vector-derived originals retain their names and contents. A 600px-wide version is written to `public/brand/landing/visuals/responsive/NAME-studio-600.webp`; its height follows the requested target ratio.

Each image is fitted into 96% of the target width and height, then receives an explicit transparent margin of approximately 2% per outer edge, rounded to whole pixels. This preserves space for shadows, restrained transforms and responsive composition. Encoding uses WebP quality 80, alpha quality 100 and effort 4. No opaque background or checkerboard is added.

## Metadata and verification

The pipeline writes:

- `public/brand/landing/visuals/studio-manifest.json`: exact paths, preserved sources, target and responsive dimensions, compressed byte sizes, padding, image-generation provenance and prompt-manifest reference.
- `public/brand/landing/visuals/studio-alpha-validation.json`: pixel-level checks for all ten primary and ten responsive exports.
- `docs/design/landing-studio/contact-sheet.png`: all ten artworks, in manifest order, composited on near-white at left and graphite at right.

The preserved generated master must already have an alpha channel with genuinely transparent pixels, before the pipeline adds padding. Every delivery export must have the expected dimensions and a real alpha channel. All four corners must be fully transparent. Transparent pixels, partially transparent glass/shadow pixels and near-opaque foreground pixels (alpha at least 250) must all be present. This accommodates generated masters whose maximum alpha is 254. The contact sheet also requires visual inspection for background remnants, consistency, silhouettes and composition.

The pipeline does not generate images, edit components, change image usage, modify original landing assets or restore any Three.js scene. The new studio manifest and contact sheet provide the concrete review step before consumers switch to these sibling paths.
