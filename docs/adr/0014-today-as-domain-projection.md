# 0014: Today is a domain projection

Status: Accepted

Context: The daily working surface combines planning, revision, skill evidence, focused time and upcoming pressure. Duplicating their models would create competing authorities.

Decision: Today owns daily plan/task execution projections and activity. Revision owns schedules, Mastery owns skill evidence, Readiness owns evaluation, source practice/study features own sessions, and interview tracking owns events. The full Planning Engine remains separate. Explicit typed ports carry authorized evidence into Today.

Alternatives: A monolithic Today database containing shadow domain tables, fabricated sample metrics and a complete planning engine embedded in the page were rejected.

Consequences: Independent sources can fail without corrupting task execution. Unimplemented domains produce honest unavailable states. Source-backed completion requires a source-owned transaction instead of a generic completion toggle.
