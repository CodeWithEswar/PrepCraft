# 0056: Supabase as notification system of record

Status: accepted
Date: 2026-10-26

## Context

Phase 18 needs reliable personal reminders across workspaces, background delivery and historical reporting, with honest source limits and no private data in transport logs.

## Decision

Keep reminders, occurrences, preferences, inbox state, delivery history and report snapshots in PostgreSQL. RLS and guarded APIs remain authoritative across retries and device changes.

## Consequences

The notification platform owns delivery orchestration while existing domains retain preparation and evidence authority. Changes must preserve owner/live-membership checks, replay safety and explicit failure states. See docs/architecture/notification-engine.md and docs/operations/notification-delivery.md for implementation and recovery.
