# Weekly reports

A report covers the last complete Monday–Sunday in its saved IANA timezone. A Sunday evening schedule still covers the previous complete week; the editor makes this explicit. Uniqueness is user + workspace + period start + weekly-report-v1.

Generation runs trusted PostgreSQL aggregates from Phase 17 Analytics, Activity, Interviews/Behavioral and the canonical Mastery evidence source. It excludes code, answers, STAR text, notes, point-level attempts, and private subscription data. Each domain has an independent coverage state. A report fails only when both attempts and activity are unavailable; partial sources remain explicit. Applications and readiness remain unavailable rather than reconstructed.

The complete snapshot and ready status commit together. A ready notification is emitted only after the report is frozen, and retries cannot rewrite a published report. Manual generation and background generation use the same database builder. A scoped internal timezone override reuses Analytics boundaries without changing workspace timezone.

The report viewer reuses Phase 17 analyticsInsights, ProgressNarrative, ChartFrame and the lazy TimingCorridor chart. There is no second score or recommendation engine. Maintain version-one interpretations when introducing future policies; introduce a new report policy rather than rewriting historical snapshots. Source due counts and framework coverage are explicitly generation-time observations, not historical readiness.

Charts retain summaries and tables. The compact notification context omits the chart bundle; the full report loads it on demand. Empty evidence is an honest starting point, not a zero-percent readiness claim.

The chart’s source-attempt action opens live Analytics for the same period. Those records may have changed since generation; the report snapshot remains frozen. Provider acceptance in delivery history is labeled separately from a confirmed email delivery receipt.
