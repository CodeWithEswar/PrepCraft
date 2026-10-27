# Responsive Analytics

Desktop has a principal evidence column and a secondary decision rail. The rail moves below the charts on smaller screens. Chart pairs collapse when the available plot area would become cramped; Topics turns into a one-column list.

Mobile is a reorganized view: six view links form a wrapping grid, filters become a bottom drawer, timing defaults to median without the percentile band, recent bucket counts shrink and charts expose full-range tables. Scatter details are available by tapping labeled attempt buttons. Calendar days are named buttons, with neutral rest-day indicators.

Tables may scroll inside their labeled, focusable container; the page and workspace content must not overflow horizontally. Long labels wrap or truncate only in a plot where the full data table preserves them. Date fields, range calendars, source sheets and Evidence Lens overlays stay within the viewport.

The audit script checks all six routes at 360, 390, 430, 768, 820, 1024, 1280, 1440, 1536 and 1920 pixels. Both themes and reduced-motion preference are exercised. Screenshots and the machine-readable accessibility report live in `docs/design/workspace`.
