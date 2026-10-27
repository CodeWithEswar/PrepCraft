# 0069: Web Push opt-in architecture

Status: accepted
Date: 2026-10-26

## Context

Phase 18 needs reliable personal reminders across workspaces, background delivery and historical reporting, with honest source limits and no private data in transport logs.

## Decision

Request permission only from an explicit user action. Store private endpoints separately, use VAPID encryption, strict provider hosts, short-lived private previews, expiry/revocation and bounded browser deduplication.

## Consequences

The notification platform owns delivery orchestration while existing domains retain preparation and evidence authority. Changes must preserve owner/live-membership checks, replay safety and explicit failure states. See docs/architecture/notification-engine.md and docs/operations/notification-delivery.md for implementation and recovery.
