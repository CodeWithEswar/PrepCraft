# Accessible evidence charts

Each figure has a human question, descriptive summary and keyboard-accessible data fallback. Headings contain only the chart title; the Evidence Lens button is adjacent so its accessible name does not pollute heading navigation. Series use labeled line styles or shapes in addition to color.

Charts do not require hover: scatter points have an HTML selection list, calendars have fully named date buttons, D3 nodes have HTML selection buttons and aggregate tables preserve measurements. Long table/overlay scroll containers are focusable and labeled. Dialogs/drawers have titles, descriptions, close actions and focus management through the existing shadcn/Base UI primitives.

Missing measurements are named as missing. Insufficient, empty, unavailable and failed states have distinct text. Rendering errors preserve fallback content. Copy failure gives a readable manual-copy instruction.

Recharts animations and the deterministic stopped D3 simulation do not create continuous motion. Reduced-motion CSS disables incidental transitions. The browser audit runs WCAG A/AA tags in both themes on desktop/mobile, including filters, attempt details, data fallback and Evidence Lens. Automated results do not replace manual screen-reader judgment; the supported control paths are covered in the interaction suite.
