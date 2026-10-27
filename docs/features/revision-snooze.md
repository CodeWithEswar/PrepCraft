# Revision Snooze

Each snooze preserves the exact previous due timestamp and lifecycle state, selected future timestamp, optional private reason, creation and undo timestamps. Interval, recall outcome and review count stay unchanged. Options are three hours later, tomorrow at 09:00, three days at 09:00 or a selected workspace-local date. The new instant must be later than now and the existing due date, within 30 days.

The server locks/version-checks the item. Active review sessions and pending reflections block snooze/retirement. Request UUID plus command hash ensures idempotency. A stale tab cannot overwrite a newer schedule.

Sonner confirms committed snoozes and offers Undo. Undo is valid for five minutes only when the item version/date remain current. It restores the exact previous timestamp/state, marks the original snooze undone and decrements the active snooze count. It never records recall.
