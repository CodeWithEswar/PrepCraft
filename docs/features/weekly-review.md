# Weekly review

The narrative is a deterministic summary of recorded schedule outcomes: planned minutes, capacity conflicts, completed task counts, carryover and source availability. Estimates never substitute for focused minutes. Confidence, health and readiness scores are not inferred.

A week can close only after its final workspace-local day. Every required unfinished task needs an explicit completion, carryover or cancellation decision. Optional unfinished tasks may remain in the closed historical record. The close transaction recomputes the immutable bounded summary in PostgreSQL, saves the user's reflection and marks the week's plans closed. A trigger protects closed task history, including against older Today mutation paths.

Closed reviews remain readable to active workspace members. There is no reopening/editing workflow in this phase. Future planning uses a new week, preserving the original review and schedule. The Execution Engine supplies recorded session minutes; weekly close captures that projection in the immutable summary.
