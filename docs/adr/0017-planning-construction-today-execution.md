# 0017: Planning constructs; Today executes

Status: Accepted. Refines 0014's initial daily-plan ownership now that the Planning domain exists.

Planning owns construction, capacity, weekly goals, plan revisions, scheduled windows and carryover. Today consumes the existing daily plan/task tables for execution, prioritization and source-owned completion. No second daily task database is introduced.

Both features share workspace-local calendar helpers and the existing workspace cache prefix. Planning mutations invalidate Today as well as the affected planning projection. Revision, Mastery, Readiness, focus sessions, Interviews and Applications retain their domain authority.
