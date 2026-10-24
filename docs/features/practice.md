# Feature: Practice Studio & Question Management

## Purpose
Provides the deliberate problem-solving environment, canonical question catalog browsing, and practice configuration.

## Ownership
- `src/features/questions/` (canonical questions, categories, difficulty, tags)
- `src/features/collections/` (custom question lists, company curated sets)
- Target route: `src/app/(workspace)/w/[workspaceSlug]/practice/`

## Key Capabilities
- Question catalog filtering by topic (DSA, Java, SQL, CS Fundamentals, System Design)
- Question detail presentation: problem statement, constraints, example test cases
- Workspace question state: bookmarks, custom candidate notes, status (Untouched, Attempted, Solved)
- Pattern tagging and company frequency metadata

## Invariants
- Canonical question content is immutable by regular users.
- Candidate personal notes and progress exist in `workspace_questions`, never overwriting canonical records.
