# Evidence chart system

`src/components/charts` supplies ChartFrame, Header, Legend, Summary, Empty/Error/Skeleton, Table, Tooltip, Evidence Lens and responsive overlays. Shared components do not import feature modules. Recharts supplies Cartesian SVG plots; D3-force is restricted to the optional relationship layout.

A chart must answer a preparation question and expose a source definition, period, sample, exclusions, policy and interpretation limits. A decorative plot without evidence is not rendered. Individual rendering failures retain the summary and table fallback.

Graphite/ivory near-solid surfaces support readable axes. Smoked Sienna is the primary series, neutral slate the reference series. Dashed lines, bands and point shapes provide non-color distinctions. Semantic green is reserved for supported source-domain states. There is no universal rainbow palette, glowing chart grid or heavy chart blur.

Default tooltips and legends are replaced by themed, explicitly labeled controls. Durations and task counts have separate units. Null measurements remain missing. Class names for empty states and legends are isolated from the older Today dashboard to prevent absolute-position overlays.

Copying a summary is user initiated. Product integration events carry only bounded counts and enum view names, never chart titles, private evidence or filters.
