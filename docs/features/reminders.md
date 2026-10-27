# Reminders

Definitions support custom, daily_plan, revision_due, weekly_target, weekly_report, upcoming_session, and target_deadline. Product presets create nothing until a user saves a definition. Each workspace permits 25 nonarchived definitions per user.

The editor uses React Hook Form, Zod, Base UI/shadcn selects, and Hugeicons. Schedules support once, daily, weekly, selected weekdays, and offsets of up to seven days before a supported task/target event. Check next occurrence asks the canonical database scheduler; the preview explicitly does not pretend to calculate a saved schedule.

Mutations carry a UUID request key and optimistic reminder version. Replaying the same command returns its previous response; changing the payload under the same key fails. A per-user advisory lock serializes commands and an audit log limits changes to 60 per minute. Pausing and archiving preserve prior occurrence history. Archived definitions cannot be silently reenabled.

Moving a task or target date updates future relative schedules. Completing, deferring, canceling, or removing a source prevents stale actions. Dispatch coalesces missed recurring times into one current logical occurrence instead of flooding a returning user. A one-time occurrence older than seven days is suppressed.

Snooze updates availability while preserving the original scheduled_for. It supports two hours, tomorrow at 09:00 in the workspace, the next positive-capacity study day, and a custom absolute time from five minutes to thirty days ahead. Source expiry can shorten that window. Previously accepted external deliveries are never resent solely because of snooze.
