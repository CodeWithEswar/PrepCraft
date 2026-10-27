"use server";
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { z } from "zod";
import { notificationCommandSchema, slugSchema, scheduleSchema } from "../schema";
import { getNotificationInbox, getNotificationSettings, getNotificationDetail, getNotificationReport } from "./queries";
export async function notificationCommand(input: unknown) { const { slug, requestId, command } = z.object({ slug: slugSchema, requestId: z.uuid(), command: notificationCommandSchema }).parse(input), db = await createClient(), { data, error } = await db.rpc("notification_command", { p_slug: slug, p_request: requestId, p_command: command as unknown as Json }); if (error) {
    if (error.code === "40001")
        throw Error("This item changed. Refresh before trying again.");
    if (error.code === "42501")
        throw Error("You no longer have access to this item.");
    if (error.code === "22023" && /^[A-Za-z0-9 .,–—'’:\-]+$/.test(error.message))
        throw Error(error.message);
    throw Error("The change could not be saved. Please retry.");
} return data as Record<string, Json>; }
export async function notificationInbox(input: unknown) { const p = z.object({ slug: slugSchema, filters: z.unknown(), cursor: z.unknown().optional() }).parse(input); const { inboxFiltersSchema, cursorSchema } = await import("../schema"); return getNotificationInbox(p.slug, inboxFiltersSchema.parse(p.filters), cursorSchema.parse(p.cursor ?? null)); }
export async function notificationSettings(slug: string) { return getNotificationSettings(slugSchema.parse(slug)); }
export async function notificationDetail(slug: string, id: string) { return getNotificationDetail(slugSchema.parse(slug), z.uuid().parse(id)); }
export async function notificationReport(slug: string, id: string) { return getNotificationReport(slugSchema.parse(slug), z.uuid().parse(id)); }
export async function notificationSchedulePreview(input: unknown) { const p = z.object({ slug: slugSchema, schedule: scheduleSchema, sourceType: z.enum(["workspace", "custom", "task", "target"]), sourceId: z.uuid().nullable() }).parse(input), db = await createClient(), { data, error } = await db.rpc("notification_schedule_preview", { p_slug: p.slug, p_schedule: p.schedule as Json, p_source_type: p.sourceType, p_source_id: p.sourceId??undefined }); if (error)
    throw Error("Choose a future schedule and an available source."); return data as {
    nextRunAt: string | null;
    timezone: string;
    dstPolicy: string;
    reportPeriod: string;
}; }
export async function notificationPreviewReport() { const { previewReport } = await import("./preview-data"); return previewReport(); }
