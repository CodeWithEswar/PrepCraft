# 0068: Phase 17 Analytics reuse

Status: accepted
Date: 2026-10-26

## Context

Phase 18 needs reliable personal reminders across workspaces, background delivery and historical reporting, with honest source limits and no private data in transport logs.

## Decision

Use existing SQL source projections, analyticsInsights, ProgressNarrative and shared charts. Do not create a second scoring, readiness or recommendation engine. Mark unavailable domains honestly.

## Consequences

The notification platform owns delivery orchestration while existing domains retain preparation and evidence authority. Changes must preserve owner/live-membership checks, replay safety and explicit failure states. See docs/architecture/notification-engine.md and docs/operations/notification-delivery.md for implementation and recovery.
