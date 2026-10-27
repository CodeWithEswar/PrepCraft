# Revision Policy v1

revision-policy-v1 is deterministic. A first committed attempt schedules one calendar day. Independent recall advances 1 → 3 → 7 → 14 → 30 days, then maintains 30 days deliberately. Small hints hold the interval. Major assistance steps back once with a one-day minimum. Failed recall resets to one day. Execution outcome mapping is centralized.

Portable TypeScript and PostgreSQL policies are parity-tested over every ladder/outcome combination. PostgreSQL owns the committed result. Confidence, raw speed and unsupported target/mistake signals cannot lengthen spacing.

UTC timestamps are persisted. Due time is 09:00 on the workspace-local completed date plus interval calendar days, using the IANA zone. DST is handled through local-calendar conversion, not adding 24 hours. A timezone change affects display/grouping and subsequent schedules; existing absolute due timestamps stay fixed until a new review or explicit snooze.

The current entity uses a composite FK to an owned Execution prompt snapshot. Revision relaunch links retain identity. Future canonical Question/concept adapters must authorize and resolve explicit identity; never merge titles or accept unsafe polymorphic UUIDs.
