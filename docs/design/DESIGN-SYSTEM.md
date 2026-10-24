# PrepCraft design system

The shared system is **Monochrome × Smoked Sienna × Mineral Glass**. It supports the marketing site and the existing shadcn primitives. The canonical brand artwork remains defined by `src/components/brand/brand-symbol-paths.ts`; the generated illustrations do not replace the official mark.

## Tokens

`src/app/globals.css` owns the source tokens and Tailwind aliases. Components consume semantic tokens rather than introducing independent palettes.

| Role | Light | Dark |
| --- | --- | --- |
| Background | `#F8F8F6` | `#121315` |
| Foreground | `#272827` | `#F2F0ED` |
| Surface | `#FDFDFC` | `#191A1D` |
| Elevated surface | `#FFFFFF` | `#222327` |
| Subtle surface | `#F2F0ED` | `#16171A` |
| Muted text | `#656A62` | `#B5B1AD` |
| Border | `#DFE2DA` | `#36363B` |
| Strong border | `#B4BAAD` | `#646169` |
| Smoked Sienna / primary | `#A15F4B` | `#A15F4B` |
| Accent text | `#714334` | `#E5B69F` |
| Focus ring | `#A15F4B` | `#D3A18A` |

The Sienna scale runs from 50 through 950. The primary stays anchored to 500; hover and active use 600/700. Near-white primary-button text is retained in both themes. Chart colors combine Sienna and quiet neutral tones; status colors have separate success, warning, info and destructive tokens.

Spacing starts at 4px. Page, wide and reading containers are 74rem, 88rem and 42rem, with fluid gutters. Section spacing runs from 3.5rem to 6rem. Radius steps span 4–24px; large content surfaces generally use 6–12px. Five restrained elevation levels cover controls, panels and overlays.

## Typography and controls

The installed Geist Sans and Geist Mono fonts remain the shared typography. Display and section headings use responsive sizes, medium weight and restrained negative tracking. Text stays real HTML; bitmap assets contain no product copy. The logo wordmark uses the existing outlined brand vectors.

`src/styles/ui.css` provides shared slot-based styling for buttons, cards, inputs, textareas, select, tabs, dialog, sheet, drawer, dropdown, popover, tooltip, command, navigation, accordion, progress, skeleton, separator, avatar and carousel. Buttons retain variants and support a branded loading state. Keyboard focus uses an explicit ring. Touch controls receive a 44px minimum target where appropriate.

All application UI icons render through `AppIcon` and Hugeicons. Compatibility adapters in `src/components/app-icon/ui-icons.tsx` keep primitive APIs intact while replacing their Lucide rendering. The landing asset validator checks that UI components no longer import Lucide.

Glass is a subtle material, with solid-surface fallbacks. Backdrop blur is limited to useful layered surfaces, disabled for mobile glass utilities, and absent from the new product-card artwork. The studio images contain their own lighting and do not receive additional large CSS shadows.

## Motion hierarchy

Interaction transitions use 120ms, 220ms and 420ms tokens and shared easing curves. The primary content is never withheld until an animation finishes.

- **Hero:** one image at a time, 420ms opacity/8px transition, seven seconds per image, explicit pause and manual controls. Navigation wraps from fifth to first in either direction. Manual selection restarts the interval. Offscreen or hidden pages stop advancing.
- **Product stack:** native CSS sticky panels under a sticky category rail on wide screens. IntersectionObserver updates the current category. Panels return to ordinary document flow on tablets, phones and reduced motion.
- **Topic strip:** a duplicated, equal-width CSS sequence moving linearly over 42 seconds, with a pause control, offscreen/hidden pause, and a wrapped static reduced-motion layout.
- **Magnetic Intent / Sienna Trace:** the CTA shell has a maximum 6px/4px pointer response, with smaller label/icon travel and a restrained edge trace. It resets for keyboard focus, touch and reduced motion.
- **Precision Reveal:** short per-line typography reveal; no character splitting. The final state is available in server HTML.
- **Revision Echo:** a small illustrated sequence within the sample revision tab.
- **Readiness Convergence:** preparation dimensions settle toward a shared structure on wide pointer devices; mobile uses a stable grid.
- **Focus Lens:** a local, low-amplitude highlight on the project illustration, limited to fine pointers.

The live reduced-motion hook uses `useSyncExternalStore`, so a preference change is reflected without reloading. Pointer motion uses MotionValues rather than per-frame React state. No custom cursor, audio or scroll hijacking is used.

## Progressive enhancement

The page is server-rendered. Native section links, product content and the first hero illustration remain available without JavaScript. Tabs, themes, slideshow controls and sample dialogs are client islands. The no-script message directs visitors to the readable workflow and availability information.

The user explicitly requested removal of the central Three.js scene after the original cinematic experiment. Three.js, React Three Fiber, Drei and their type package have been removed; the current landing renders no canvas and makes no WebGL request. The former Craftfield requirement is superseded by that direction.

## Truthful preview

The page describes an early product preview. The practice reflection and starter checklist are local demonstrations. They do not execute code, create accounts, save a workspace, predict interview outcomes or send data to a backend. Progress values and the timeline are labelled illustrative. No customer logos, testimonials, placements, user counts or performance statistics have been invented.

## Refined dark layout

Dark surfaces use neutral graphite with warm white text and copper accents. Readiness, timeline and FAQ introductions are centered; readiness uses balanced cards that stack on phones, and the journey becomes a two-column numbered list. The header is 64px on desktop and 60px on phones; sticky category offsets share the same token. Desktop WebKit scrollbars use a 10px track with an inset rounded copper thumb and hover feedback; Firefox receives a native thin color-matched fallback. Touch scrollbars remain platform-native.
