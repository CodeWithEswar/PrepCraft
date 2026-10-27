# Notification inbox

Read/unread, saved, archived, source resolution, and snooze are separate pieces of state. Saving does not mark an item read; archiving preserves saved and read timestamps. Restoring an item returns it to its existing read state. Opening a source validates membership and current source relevance before resolving a structured destination.

All, Unread, Saved, Archive, and Snoozed views support text, category, date, and accessible-workspace filters. Local-date headings use the current workspace timezone. Keyset pagination orders created_at DESC, id DESC, returns at most thirty rows, and keeps the UUID tie-breaker in the cursor. Counts stop at 501 and are presented as 500+.

Bulk commands accept at most fifty UUIDs and fail atomically if any item is outside the current user's accessible workspaces. The Attention Digest counts relevant important items and revision counts captured in those reminders; it does not invent urgency or readiness.

Desktop uses an inbox, contextual reading column, and settings rail. Below 1400px, context uses an accessible sheet. Below 1051px, preferences also use a sheet. Tab and form controls remain usable with the keyboard; overflow uses the theme's thin, arrowless scrollbar.
