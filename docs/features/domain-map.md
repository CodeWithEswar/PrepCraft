# Feature ownership and delivery order

Only `marketing` is implemented. The following domains are reserved ownership decisions, not empty folders or completion claims.

| Domain | Owns | Does not own |
| --- | --- | --- |
| marketing | Public preview content, sections, illustrations and motion | Auth or saved preparation state |
| auth / onboarding | Identity/session workflows / initial setup | Workspace authorization rules |
| workspaces / targets | Membership and isolation / preparation goals | Domain calculations |
| planning / today / reminders | Plans and calendar / daily composition / due reminders | Today does not own planning rules |
| questions / collections | Canonical question content / organization | Personal attempt history |
| attempts / timers / code-execution | Attempt evidence / elapsed time / isolated execution integration | In-process arbitrary code execution |
| mistakes / patterns | Root causes, correction and review / pattern recognition | Generic unstructured progress blobs |
| revision / mastery / readiness | Review timing / evidence strength / goal evidence criteria | Each other's rules; `progress` is a composing route |
| study-sessions / flashcards / cheat-sheets | Session records / recall cards / concise reference material | Global generic content ownership |
| aptitude / fundamentals / projects / behavioral | Subject preparation and personal explanations | Canonical DSA ownership |
| interviews | Real OA/interview schedules, rounds, timer, day mode, journal, encountered questions and reflection | AI mocks or video interviews |
| applications / resumes | Application stage/history / resume records | Interview-domain internals or raw object-store authority |
| analytics / activity / notifications / files | Derived views / append-only events / delivery preferences and records / user-facing file metadata and actions | A competing database; raw R2 infrastructure |

Application stages: Saved, Applied, OA, Technical I, Technical II, Final, Offer, Rejected, Withdrawn. Stage-change rules and history belong to applications. An interview scheduling workflow may invoke planning through a deliberate application service/contract after user approval; it must not create applications ↔ interviews import cycles.

Material events such as `workspace.created`, `question.attempt.completed`, `revision.completed`, `interview.scheduled` and `application.stage_changed` become versioned contracts when implemented. Analytics consumes these events instead of owning feature writes.

Build sequence: foundation → auth → workspace → planning/today → questions/attempts/timers → isolated execution → mistakes/patterns/revision/mastery/readiness → study tools → analytics → interview tracking → applications/resumes → personalization → platform hardening. Phase 03 stops at foundation.

A feature is done only with its responsive UX and states, schemas/constraints/indexes, RLS and server authorization, validation, domain rules, query/mutation layer, activity/observability, meaningful tests and updated documentation. Introduce directories and abstractions when those responsibilities actually exist.
