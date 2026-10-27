# Attempt Debrief

Finishing commits timing first and creates one pending attempt per session item. Debrief is a separate, recoverable working state with Outcome, Timing, Approach, Complexity, Confidence, Mistakes, Reflection and Follow-up sections. Save reflection draft persists partial entries without committing a reported result. Final Save attempt is explicit.

Outcomes are solved independently, solved with a small hint, solved with a major hint and could not solve. Hint evidence restricts incompatible outcomes. Confidence uses meaningful levels 1–5 rather than stars. Controlled mistake categories capture recognition, logic, syntax, edge cases, complexity, forgotten concepts, communication and time management. Complexity accepts common presets and custom expressions. Patterns reference the existing canonical text IDs.

Duration and target variance derive from recorded active intervals, excluding pauses and reflection. Faster timing is not presented as automatically better. The Attempt Trace includes only captured start, pause/resume, phase, hint, navigation and end events.

Final evidence and a unique downstream outbox event commit atomically. Committed reflections are read-only in this phase. The summary shows recorded duration, reported outcome, confidence, mistakes and honest revision status: evidence saved, revision not scheduled until a real consumer exists. It can continue another pending question's reflection, review the saved question, open an authorized Planning follow-up, or return to Today for the next recommendation.
