"use client";
import { useEffect, useMemo } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { queryKeys } from "@/lib/query/keys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { notificationCommand, notificationInbox, notificationSettings } from "./server/actions";
import { sampleNotifications } from "./preview";
import { filterInbox, defaultInboxFilters } from "./policy";
import { notificationCommandSchema, type NotificationCommand } from "./schema";
import type { NotificationBootstrap } from "./types";
export function useNotifications(slug: string, userId: string, workspaceId: string, preview: boolean, initial?: NotificationBootstrap, filters = defaultInboxFilters, subscribeToUpdates = false) {
    const stableSearch=useDebouncedValue(filters.search),stableFilters={...filters,search:stableSearch};
    const client = useQueryClient(), root = useMemo(() => queryKeys.notifications(workspaceId,userId), [workspaceId, userId]), storeKey = [...root, "preview"], sample = useQuery({ queryKey: storeKey, queryFn: () => sampleNotifications(), initialData: preview ? (initial || sampleNotifications()) : undefined, enabled: preview, staleTime: Infinity });
    const inbox = useQuery({ queryKey: [...root, "inbox", stableFilters], queryFn: () => notificationInbox({ slug, filters:stableFilters }), initialData: !preview && JSON.stringify(filters) === JSON.stringify(defaultInboxFilters) ? initial?.inbox : undefined, enabled: !preview, refetchInterval: 60000, refetchOnWindowFocus: true, staleTime: 15000 }), settings = useQuery({ queryKey: [...root, "settings"], queryFn: () => notificationSettings(slug), initialData: !preview ? initial?.settings : undefined, enabled: !preview, staleTime: 30000 });
    useEffect(() => { if (preview || !subscribeToUpdates)
        return; const db = createClient(), channel = db.channel(`notifications:${workspaceId}:${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => { void client.invalidateQueries({ queryKey: root }); }).subscribe(); return () => { void db.removeChannel(channel); }; }, [preview, workspaceId, userId, client, root, subscribeToUpdates]);
    const invalidate = () => client.invalidateQueries({ queryKey: root });
    async function command(command: NotificationCommand) {
        const validation = notificationCommandSchema.safeParse(command);
        if (!validation.success)
            throw Error(validation.error.issues[0]?.message || "Check the notification settings.");
        command = validation.data;
        if (!preview) {
            const r = await notificationCommand({ slug, requestId: crypto.randomUUID(), command });
            await invalidate();
            return r;
        }
        const now = new Date().toISOString();
        let response: Record<string, unknown> = { saved: true };
        client.setQueryData<NotificationBootstrap>(storeKey, current => {
            if (!current)
                return current;
            const b = structuredClone(current);
            if (command.kind === "notifications.bulk")
                for (const n of b.inbox.items.filter(n => command.ids.includes(n.id))) {
                    if (command.action === "read") {
                        n.readAt = now;
                        if (n.state === "available")
                            n.state = "read";
                    }
                    if (command.action === "unread") {
                        n.readAt = null;
                        if (n.state === "read")
                            n.state = "available";
                    }
                    if (command.action === "save")
                        n.savedAt = now;
                    if (command.action === "unsave")
                        n.savedAt = null;
                    if (command.action === "archive") {
                        n.archivedAt = now;
                        n.state = "archived";
                    }
                    if (command.action === "restore") {
                        n.archivedAt = null;
                        n.state = n.readAt ? "read" : "available";
                    }
                }
            if (command.kind === "notification.snooze") {
                const n = b.inbox.items.find(n => n.id === command.id);
                if (n) {
                    n.state = "pending";
                    n.snoozedUntil = command.until || new Date(Date.parse(now) + 7200000).toISOString();
                    n.availableAt = n.snoozedUntil;
                }
            }
            if (command.kind === "notification.open") {
                const n = b.inbox.items.find(n => n.id === command.id);
                if (n) {
                    n.readAt = now;
                    n.state = "read";
                    response = { actionType: n.actionType, workspaceSlug: n.workspace.slug, sourceId: n.sourceId, handled: !!n.resolvedAt };
                }
            }
            if (command.kind === "reminder.save") {
                const r = { ...command };
                const existing = b.settings.reminders.find(x => x.id === command.id);
                const next = { ...r, id: command.id || crypto.randomUUID(), version: (existing?.version ?? -1) + 1, archivedAt: null, nextRunAt: null, lastRunAt: null };
                if (existing)
                    b.settings.reminders = b.settings.reminders.map(x => x.id === existing.id ? next : x);
                else
                    b.settings.reminders.push(next);
            }
            if (command.kind === "reminder.toggle" || command.kind === "reminder.archive") {
                const r = b.settings.reminders.find(r => r.id === command.id);
                if (r) {
                    r.enabled = command.kind === "reminder.archive" ? false : !r.enabled;
                    r.version++;
                    if (command.kind === "reminder.archive")
                        r.archivedAt = now;
                }
            }
            if (command.kind === "preference.save")
                b.settings.effective = command;
            if (command.kind === "preference.reset")
                b.settings.effective = sampleNotifications(now).settings.effective;
            return b;
        });
        return response;
    }
    const state = preview ? sample.data : undefined, filtered = state ? filterInbox(state.inbox.items, filters, state.inbox.context.asOf) : null;
    return { page: state ? { ...state.inbox, ...filtered } : inbox.data, settings: state?.settings || settings.data, error: inbox.error || settings.error, loading: !preview && (inbox.isPending || settings.isPending), command, invalidate, root, refetch: () => Promise.all([inbox.refetch(), settings.refetch()]) };
}
