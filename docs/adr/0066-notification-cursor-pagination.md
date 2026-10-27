# 0066: Cursor pagination for inbox

Status: accepted
Date: 2026-10-26

## Context

Phase 18 needs reliable personal reminders across workspaces, background delivery and historical reporting, with honest source limits and no private data in transport logs.

## Decision

Order by created_at and UUID, both descending. Return thirty rows and cap counts. Fifty-item atomic bulk actions keep query and mutation costs bounded.

## Consequences

The notification platform owns delivery orchestration while existing domains retain preparation and evidence authority. Changes must preserve owner/live-membership checks, replay safety and explicit failure states. See docs/architecture/notification-engine.md and docs/operations/notification-delivery.md for implementation and recovery.
