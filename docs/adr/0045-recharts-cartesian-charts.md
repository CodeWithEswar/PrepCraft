# Recharts for Cartesian evidence

Status: Accepted · 2026-10-26

Use installed Recharts for line, area, bar and scatter charts through the shared evidence frame. SVG supports the existing React stack and a consistent themed tooltip/legend system. Duplicating basic chart infrastructure in D3 would add maintenance without a preparation benefit.

Every chart still requires summaries, data fallback, sample limits and explicit sources. Recharts accessibility is supplementary to these HTML paths, not their replacement.
