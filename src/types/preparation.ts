/** Shared schedule vocabulary. Source domains continue to own their own completion. */
export type TaskType = "dsa" | "revision" | "aptitude" | "language" | "fundamentals" | "projects" | "behavioral" | "interview" | "timed_practice" | "custom"
export type TaskStatus = "planned" | "in_progress" | "completed" | "skipped" | "deferred" | "cancelled"
export type TaskSource = "custom" | "revision" | "practice" | "study" | "interview"
