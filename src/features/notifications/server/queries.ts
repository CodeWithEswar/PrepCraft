import "server-only";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspace } from "@/features/workspaces/server";
import type { Json } from "@/lib/supabase/types";
import { slugSchema, inboxFiltersSchema, cursorSchema } from "../schema";
import type { InboxFilters, InboxPage, NotificationBootstrap, NotificationSettings, NotificationDetail, Report } from "../types";
export async function getNotificationInbox(slug: string, filters: InboxFilters, cursor: InboxPage["cursor"] = null): Promise<InboxPage> { slugSchema.parse(slug); const db = await createClient(), { data, error } = await db.rpc("notification_inbox", { p_slug: slug, p_filters: inboxFiltersSchema.parse(filters) as Json, p_cursor: cursorSchema.parse(cursor) as Json, p_limit: 30 }); if (error || !data)
    throw Error("The inbox could not be loaded. Please retry."); return data as unknown as InboxPage; }
export async function getNotificationSettings(slug: string): Promise<NotificationSettings> { slugSchema.parse(slug); const db = await createClient(), { data, error } = await db.rpc("notification_settings", { p_slug: slug }); if (error || !data)
    throw Error("Reminder settings could not be loaded. Please retry."); return data as unknown as NotificationSettings; }
export async function getNotificationBootstrap(slug: string): Promise<NotificationBootstrap> { const w = await resolveWorkspace(slug); if (!w?.permissions.canView)
    throw Error("Notification access unavailable."); const db = await createClient(); await db.rpc("notification_check", { p_slug: slug }); const [inbox, settings] = await Promise.all([getNotificationInbox(slug, inboxFiltersSchema.parse({})), getNotificationSettings(slug)]); return { inbox, settings, preview: false }; }
export async function getNotificationDetail(slug: string, id: string): Promise<NotificationDetail> { slugSchema.parse(slug); const db = await createClient(), { data, error } = await db.rpc("notification_detail", { p_slug: slug, p_id: id }); if (error || !data)
    throw Error("Notification details could not be loaded."); return data as unknown as NotificationDetail; }
export async function getNotificationReport(slug: string, id: string): Promise<Report> { slugSchema.parse(slug); const db = await createClient(), { data, error } = await db.rpc("notification_report", { p_slug: slug, p_id: id }); if (error || !data)
    throw Error("This report is unavailable."); return data as unknown as Report; }
