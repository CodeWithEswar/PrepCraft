# Behavioral story model

star_stories is workspace/user-owned. star_story_principles is many-to-many with a single partial-unique primary mapping. Framework and prompt identifiers include published versions. workspace_behavioral_settings selects the view; it never owns or copies story facts. Metadata library queries exclude full STAR/private-note bodies and mapping notes; a selected detail is fetched progressively.

behavioral_practice_bindings joins an owned story version to existing execution_session_items through a composite workspace/user foreign key. It snapshots facts, prompt identity and principle IDs, then records cue use and committed self-ratings. It stores no alternate timer, attempt outcome or revision due date. question_attempts and attempt_outbox_events remain the common evidence source.

Queries use fixed limits and timestamp/UUID keysets: library 40+1, prompts 20+1, history 30+1. EXPLAIN ANALYZE fixtures are recorded in docs/design/workspace/behavioral-query-plans.json; these small ownership fixtures are not a scale benchmark.
