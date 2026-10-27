# Notification engine

The domain boundary is src/features/notifications. Public feature entries expose presentation and server loaders. Shared AppShell accepts a notificationControl slot; it imports no feature implementation. Live and preview workspace compositions inject the bell.

PostgreSQL owns nine RLS-protected public entities: reminders, reminder_schedules, reminder_occurrences, notifications, notification_deliveries, notification_preferences, weekly_reports, push_subscriptions and notification_actions. Private tables hold credentials, runtime configuration, provider event receipts and the transactional outbox.

Public user facades are invokers over guarded private functions. User mutations require verified auth.uid(), live membership, relevant workspace write permissions, request idempotency and source validation. Internal helpers are not executable by API roles. Worker facades are service-role-only and revalidate the intended source before delivery.

A notification is a user-facing occurrence; a delivery is one channel's attempt history. In-app delivery commits with the occurrence independently of queues. Live reads poll at sixty seconds and refetch on focus; one bell-owned, user-filtered Realtime subscription invalidates the scoped cache. Query keys include both workspace and user IDs. Preview mutations clone a separate TanStack cache and never call account commands.
