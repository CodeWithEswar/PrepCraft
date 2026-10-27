# Session Blueprints

## 1. Concept
A `SessionBlueprint` defines the structured composition of a mock interview:
- `name` & `description`
- `mode`: coding, cs_fundamentals, behavioral, project_deep_dive, mixed, oa, custom
- `durationMinutes`: total session duration
- `difficulty`: easy, medium, hard, mixed
- `sourceType`: platform, company_template, workspace_custom, quick_generated
- `sectionsConfig`: array of sections (type, question count, duration)
- `policySnapshot`: frozen copy of the `SimulationPolicy`

## 2. Canonical Platform Blueprints
- `blueprint-amazon-sde-mixed`: 60m Amazon SDE Technical Mock (Coding x 2, CS Fundamentals x 3, Project x 1)
- `blueprint-quick-coding-30`: 30m DSA problem solving under whiteboard pressure
- `blueprint-mixed-technical-45`: 45m balanced simulation across all technical disciplines
- `blueprint-cs-fundamentals-20`: 20m rapid-fire Java, SQL, OS, and Networks
- `blueprint-behavioral-15`: 15m STAR leadership evaluation
- `blueprint-project-deepdive-30`: 30m architecture, scalability, and debugging interrogation
- `blueprint-oa-simulator-60`: 60m strict timed OA environment
