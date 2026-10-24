# Landing validation — 24 October 2026

## Dark-theme refinement follow-up

The latest revision replaces green-tinted dark tokens with neutral graphite and copper, reduces the header to 64px desktop / 60px mobile, centers readiness/timeline/FAQ headings, improves responsive cards and timeline steps, and styles desktop WebKit scrollbars with rounded inset thumbs. FAQ chevrons now share one trailing container so their hidden icon wrappers cannot disrupt alignment.

Six Chrome landing tests passed, followed by eight focused responsive/product checks across Chrome, Edge, Firefox and WebKit. Responsive coverage spans 11 widths from 360px to 1920px. The final production build and lint passed; the production audit after the FAQ correction reports zero automated violations in all four viewport/theme combinations and no client errors. Clean production section screenshots are `readiness-desktop-dark.png`, `readiness-mobile-dark.png`, `faq-desktop-dark.png`, and `faq-mobile-dark.png`.

The completed landing uses PrepCraft's Smoked Sienna, monochrome and mineral-glass theme, with a Razorpay-inspired section structure and native scrolling. All ten body illustrations have premium transparent studio replacements matching the five hero scenes.

## Completed checks

- Full browser matrix: 36 checks passed across Chrome, Edge, Firefox and WebKit during implementation. These cover brand, responsive layouts, theme/navigation, preview interactions, sticky panels, tabs, slideshow wrapping/pause, reduced motion, no JavaScript and unavailable WebGL.
- Final card-track change: the Chrome product-stack test passed again, including Next/Previous scroll position assertions, active category tracking, preparation tabs, image loading and desktop/tablet/mobile screenshots.
- Final `npm run lint` and `npm run build`: passed. The production build includes TypeScript validation.
- Unit tests: 3 passed during implementation.
- Asset validation: 37 primary landing assets checked for dimensions, transparency and preserved sources during implementation.
- Final production route checks: homepage, metadata and assets return 200; `/dev/brand` returns 404; manifest icons are reachable.
- Final production accessibility audit: zero automated WCAG-tagged violations in desktop light/dark and touch-mobile light/dark. The earlier transient focus-guard report was caused by auditing the theme popup during its exit animation; the audit now waits for the popup to detach and the requested theme to apply, without excluding the focus guards or disabling any rule.

## Local performance observations

| Viewport | LCP | CLS | Client errors | Canvas elements |
| --- | --- | --- | --- | --- |
| 1440 × 900 | 1,740 ms | 0 | 0 | 0 |
| 390 × 844 touch | 424 ms | 0 | 0 | 0 |

Transferred JavaScript was approximately 320 KiB in each local run. Raw evidence is in `MARKETING-AUDIT.json`. These are unthrottled local production observations, not field Core Web Vitals or an INP claim. Automated accessibility checks do not certify full WCAG conformance; WebKit on Windows is not a physical Safari/iPhone test.

Screenshots: `hero-desktop-light.png`, `hero-mobile-light.png`, `landing-desktop-light.png`, `landing-desktop-dark.png`, `landing-tablet.png`, `landing-mobile-light.png`, and `landing-mobile-dark.png`. The full-page captures use reduced motion so every stacked section is visible in the image; ordinary sticky behavior is checked separately.

The earlier approval-review usage-limit interruption was resolved when work resumed; the final browser check, build and production audit above completed successfully. No public deployment was performed. The page's preparation examples remain browser-local previews.
