# 0026 — Derive due and overdue from authoritative time

Status: Accepted. Date: 2026-10-25.

Persist scheduled/snoozed/retired/archived. Derive due from UTC instant and overdue from workspace-local calendar date. Avoid midnight mass updates. New schedules are due at 09:00 after calendar-day spacing; timezone changes never silently move existing instants.
