# PrepCraft glass workspace shell

The supplied PrepOS reference informed the composition: an inset translucent sidebar, a shared glass frame, compact search/account header, sunrise landscape, copper statistic tiles, and three dashboard panels. PrepCraft's canonical brand and Graphite Monochrome × Smoked Sienna × Mineral Glass theme remain in use.

## Review

- `/preview` — dashboard with explicitly labelled sample data.
- `/preview/practice`, `/preview/mistakes`, `/preview/patterns`, `/preview/plan`, `/preview/applications`, `/preview/interview` — interactive visual examples of the reference's supporting screens.
- Other sidebar destinations have working preview views; the route group is noindex.
- `/w/[workspaceSlug]/*` — the same shell wraps the existing server-authorized workspace routes. Workspace resolution, membership checks, switching and settings still use their existing feature APIs. The shell adds no database tables, policies or elevated access.

Sample progress, achievements, companies, history and schedules appear only in the labelled preview. The live Today view uses empty metrics/activity until the underlying preparation domains are connected, while retaining the existing real target/commitment summary. Draft focus tasks are browser-local for the current page visit. Preview application additions and checklists are also local, not saved product records. The Java example explains an approach; it does not execute code. No mock interview feature is added.

## Ownership

| Path | Responsibility |
| --- | --- |
| `src/components/shell` | Presentational shell, navigation, search, desktop collapse, mobile Sheet, theme/account controls |
| `src/features/workspaces/components/workspace-shell.tsx` | Existing workspace switcher and real route mapping |
| `src/features/today` | Dashboard composition, empty/sample states, chart and local focus-task drafts |
| `src/features/workspace-preview` | Explicit sample content and interactive reference views |
| `src/app/preview` | Public noindex design preview routes |
| `public/brand/workspace` | Generated, optimized landscape wallpaper |
| `tests/e2e/workspace-shell.spec.ts` | Responsive, navigation, keyboard search, forms, route and reduced-motion checks |

At desktop sizes the sidebar is 236px and collapses to 78px. At tablet/mobile widths it becomes a modal Sheet. Dashboard cards reorganize from six statistic columns and three content columns to two statistic columns and stacked content. Tables and the calendar scroll within their panels. Native scrolling is retained, and reduced-motion preferences remain respected.

The backdrop was generated with the built-in image generation tool and exported as a 1920×1080 WebP (94,532 bytes) plus a 960×540 mobile version. Provenance is retained in `workspace/wallpaper-provenance.json`. Blur is concentrated in the frame/sidebar rather than repeated on every card.

Dark mode uses a separate generated slate mountain-lake scene at dusk, with a restrained copper horizon. Its desktop WebP is 1672×941 (61,956 bytes) and its mobile WebP is 960×540 (26,338 bytes). Theme and responsive CSS choose the appropriate image automatically. A lighter neutral overlay preserves the dusk landscape while the graphite panels keep content readable. The full image-generation prompt and source are recorded in `workspace/dark-wallpaper-provenance.json`; reviewed screenshots are `workspace/dashboard-dusk-desktop.png` and `workspace/dashboard-dusk-mobile.png`.

The follow-up dark-theme refinement makes graphite card surfaces 95% opaque, replaces the brown sidebar tint with neutral charcoal, and reduces frame/sidebar/mobile-menu blur to 3px/7px/6px respectively. Statistic and content cards have no individual backdrop blur. Copper remains limited to navigation selection, icons and progress accents. Reviewed screenshots are `workspace/dashboard-dark-refined.png` and `workspace/dashboard-mobile-dark-refined.png`.

The workspace selector now uses Hugeicons, mixed-case workspace titles, clear current-selection markers and a search field with a subtle focus underline. Active and archived workspaces remain searchable. Switching failures retain the current workspace cache and show an inline error; successful switching preserves the current section. The public preview offers explicitly sample workspaces and keeps each desktop/mobile picker independent.

Weekly progress and focus-task duration use the existing shadcn Select components with themed popups, selected-item indicators, keyboard controls and larger touch targets. Open controls were checked in light/dark at desktop/mobile sizes: all eight automated accessibility checks reported zero violations and no client errors (`workspace/controls-accessibility-audit.json`). Selector workflow unit tests passed (2), alongside typecheck, scoped lint, architecture checks and the production build. Browser coverage includes filtering, keyboard selection, task-duration submission and mobile popup bounds. Screenshots include `workspace/dashboard-select-dark.png`, `workspace/select-light.png` and `workspace/workspace-picker-dark.png`.

## Validation

- Production build passed, including the live workspace and preview route compilation.
- Typecheck passed.
- Scoped ESLint for the shell, Today, preview, integration files and tests passed.
- The full lint command found an existing unrelated `set-state-in-effect` error in `features/onboarding/components/onboarding-shell.tsx`, plus existing form/compiler warnings; that onboarding behavior was not changed by this UI task.
- Unit suite: 122 tests passed. This includes Server Action RPC boundary coverage; ordinary server module imports remain prohibited from client graphs.
- Architecture check: 286 source modules passed. File-level Server Actions are recognized as Next RPC boundaries; the existing workspace mutation module is explicitly server-only.
- Chrome, Firefox and WebKit passed responsive/sidebar/search/theme checks. All three passed the local task/application form flow after test locator scoping and removal of redundant card blur. The Firefox form retest completed in 10 seconds.
- Chrome rendered all 16 preview section destinations successfully, including reduced-motion mode. Viewport coverage includes 360, 390, 768, 1024, 1440 and 1920px.
- Automated WCAG-tagged checks report zero violations and no client errors in desktop/mobile light and dark. Raw audit: `workspace/accessibility-audit.json`. This is automated evidence, not a full manual conformance certification.

Authenticated live-workspace rendering requires a signed-in account and existing workspace; no account or sample database history was created for the visual check. The public preview exercises the same shared shell without bypassing authorization. No public deployment was performed.
