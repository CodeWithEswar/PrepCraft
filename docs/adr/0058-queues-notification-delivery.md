# 0058: Cloudflare Queues for delivery

Status: accepted
Date: 2026-10-26

## Context

Phase 18 needs reliable personal reminders across workspaces, background delivery and historical reporting, with honest source limits and no private data in transport logs.

## Decision

Separate delivery and report queues, use bounded batch/concurrency, exponential retries and dead-letter queues. Persist terminal outcomes in Supabase before acknowledging.

## Consequences

The notification platform owns delivery orchestration while existing domains retain preparation and evidence authority. Changes must preserve owner/live-membership checks, replay safety and explicit failure states. See docs/architecture/notification-engine.md and docs/operations/notification-delivery.md for implementation and recovery.
