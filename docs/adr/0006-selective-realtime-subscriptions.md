# 0006: Selective rather than universal realtime subscriptions

**Status:** Accepted, 24 October 2026.

**Context:** Supabase Realtime provides live WebSocket channels that push database changes to connected clients. However, subscribing to every application table creates excessive WebSocket connection overhead, high server CPU consumption, client battery drain on mobile devices, and complex race conditions between optimistic local UI state and incoming server updates.

**Decision:**
1. Default to **Server-First dynamic rendering and deterministic Server Action revalidation** (`revalidatePath`, `revalidateTag`) for ordinary application views.
2. Restrict Supabase Realtime to high-value, collaborative, or ambient notification scenarios:
   - In-app notification counters / urgent alerts.
   - Live multi-tab session synchronization where stale state causes user conflict.
3. Prohibit indiscriminate Realtime subscriptions on read-heavy or private tables (e.g., question catalog, full attempt logs, study plan history). Polling, manual refresh, or optimistic UI updates are preferred.

**Alternatives Considered:**
- Universal Realtime on all workspace tables: Rejected because it drastically increases database replication load and client-side complexity without providing tangible UX value for single-user study sessions.
- Pure HTTP polling for everything: Rejected because time-critical notification alerts benefit from sub-second push delivery.

**Consequences:**
- Client components only open WebSocket connections when viewing screens that explicitly require live multi-client synchronization.
- Server load and connection pool limits remain predictable as the user base scales.
