# PrepCraft Terminology & Ubiquitous Language

To maintain clarity across engineering, design, and domain boundaries, use these exact terms throughout code, documentation, and communication:

| Term | Definition | Anti-Pattern / What It Is NOT |
| --- | --- | --- |
| **Workspace** | The isolated tenant boundary owning a candidate's personal preparation context, goals, and history. | Not a multi-tenant corporate team or shared repository. |
| **Question** | Canonical, immutable question definition (title, description, test cases, canonical pattern tags). | Not user-specific progress or personal notes. |
| **Workspace Question** | The user's relationship to a canonical question (custom notes, bookmarks, custom tags, status). | Not canonical question definitions. |
| **Attempt** | An immutable record of a user working through a question (code snapshot, elapsed time, outcome, self-rating). | Not an editable mutable state. |
| **Mistake** | A classified learning gap extracted from an attempt (logic error, missed edge case, complexity overshoot, syntax gap). | Not a freeform throwaway comment string. |
| **Revision** | An intentionally scheduled revisit based on spaced repetition intervals. | Not random cramming or passive question re-reading. |
| **Mastery** | The algorithmic evaluation of evidence strength for a specific topic or pattern. | Not a self-declared vanity score. |
| **Readiness** | The evaluated alignment between a user's cumulative evidence and their chosen target/deadline. | Not a guarantee of an offer or an interview prediction. |
| **Interview** | A real-world scheduled technical interview or Online Assessment (OA) with a company. | **Never an AI mock interview or automated video bot.** |
| **Application** | A job application pipeline entry tracking company, role, stage, deadlines, and linked interviews. | Not a generic job scraper. |
