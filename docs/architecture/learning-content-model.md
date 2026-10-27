# Shared learning content model

Audit: existing tracks/topics/patterns are canonical and text-keyed. question_attempts are Execution-owned prompt snapshots. There was no real Question Library, concept catalog, Code Runner or Mistake Journal service.

Learning reuses tracks and topics. learning_subjects is a presentation grouping: Java maps to programming-language, SQL/DBMS to databases-sql, OS and Networks to cs-fundamentals, and Aptitude adds one canonical track. learning_topic_catalog extends topic metadata without a second identity.

learning_concepts has composite (id, version) identity, lifecycle, original safe-text content and provenance. learning_activities versions reference a concept version; each published check currently represents one reusable question. Answer keys/solutions live exclusively in private.learning_answer_keys. Relations support related, compare_with, builds_on and acyclic prerequisite edges.

workspace_learning_state stores visits, bookmarks and private notes with optimistic concurrency. learning_execution_bindings only connects a canonical activity version to an Execution item and records server evaluation metadata. It does not duplicate attempts. No subject-specific progress/attempt database exists.

Optional library enrichment may be practiced outside the pinned template, but explicit topic/track exclusions are respected by execution_topic_allowed. New evidence areas appear in Mastery using canonical catalog metadata, with optional priority; template snapshots and priorities are never rewritten.

Catalog queries bound metadata. Search covers published concepts and parent topic names, with indexed full-text matching and bounded fallback substring matching for this small catalog. Planned outline labels may appear in browse metadata; draft lesson bodies/activities are unavailable to normal users.
