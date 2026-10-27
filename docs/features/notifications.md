# Notifications

Phase 18 is a delivery platform over existing preparation domains. Supabase owns the inbox, reminders, schedule occurrences, preferences, immutable weekly reports, and delivery history. Cloudflare wakes the dispatcher and executes bounded queue jobs. There is no D1 database.

Open /w/:workspaceSlug/notifications. /preview/notifications is an isolated, interactive sample and never writes to an account. The shell bell shares the current user/workspace query cache with the inbox. Its unread badge comes from persisted inbox state; failed requests show a retry state instead of claiming the user is caught up.

Supported sources are open Planning tasks, current Revision due items, weekly plans, workspace target dates, and manual reminders. Interview trackers and Applications do not yet provide authoritative reminder sources; no sample company or interview is presented as account data. Planned-session reminders follow real scheduled tasks and are described as planned sessions.

The event categories are plan, revision, practice, interview, application, report, workspace, system, and custom. Reserved categories do not imply source integration. Priorities are normal and important; importance never bypasses quiet hours automatically.

See notification-inbox.md, reminders.md, weekly-reports.md, and the operational delivery runbook. Email remains an unconfigured placeholder until an explicit provider and verified sender are supplied.
