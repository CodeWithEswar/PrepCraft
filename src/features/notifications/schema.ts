import { z } from "zod";
import { categories } from "./types";
export const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
const uuid = z.uuid(), time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/);
export const scheduleSchema = z.object({ scheduleType: z.enum(["once", "daily", "weekly", "selected_days", "event_relative"]), timezone: z.string().min(1).max(80).refine(v => { try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return v === "UTC" || v.includes("/");
    }
    catch {
        return false;
    } }, "Choose a valid IANA timezone."), localTime: time.nullish(), daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7).nullish(), localDate: z.iso.date().nullish(), absoluteAt: z.iso.datetime({ offset: true }).nullish(), offsetMinutes: z.number().int().min(-10080).max(0).nullish() }).superRefine((s, c) => { if (["daily", "weekly", "selected_days"].includes(s.scheduleType) && !s.localTime)
    c.addIssue({ code: "custom", path: ["localTime"], message: "Choose a local time." }); if (["weekly", "selected_days"].includes(s.scheduleType) && !s.daysOfWeek?.length)
    c.addIssue({ code: "custom", path: ["daysOfWeek"], message: "Choose weekdays." }); if (s.scheduleType === "weekly" && s.daysOfWeek?.length !== 1)
    c.addIssue({ code: "custom", path: ["daysOfWeek"], message: "Choose one weekday." }); if (s.scheduleType === "once" && !s.absoluteAt && !(s.localDate && s.localTime))
    c.addIssue({ code: "custom", path: ["localDate"], message: "Choose a date and time." }); if (s.scheduleType === "event_relative" && s.offsetMinutes == null)
    c.addIssue({ code: "custom", path: ["offsetMinutes"], message: "Choose an offset." }); });
export const reminderFormSchema = z.object({ id: uuid.optional(), version: z.number().int().nonnegative().optional(), type: z.enum(["custom", "daily_plan", "revision_due", "weekly_target", "weekly_report", "upcoming_session", "target_deadline"]), title: z.string().trim().min(1, "Give this reminder a title.").max(160), body: z.string().max(1000), sourceType: z.enum(["workspace", "task", "target", "custom"]), sourceId: uuid.nullable(), priority: z.enum(["normal", "important"]), channels: z.array(z.enum(["in_app", "email", "push"])).min(1).max(3), enabled: z.boolean(), respectQuietHours: z.boolean(), schedule: scheduleSchema });
const preference = z.object({ kind: z.literal("preference.save"), scope: z.enum(["account", "workspace"]), family: z.enum(["*", ...categories]), inApp: z.boolean(), email: z.boolean(), push: z.boolean(), quietEnabled: z.boolean(), quietStart: time, quietEnd: time, timezone: scheduleSchema.shape.timezone, pushPrivacy: z.enum(["private", "detailed"]) }).refine(p => p.quietStart !== p.quietEnd, { message: "Quiet hours need different start and end times.", path: ["quietEnd"] });
export const notificationCommandSchema = z.discriminatedUnion("kind", [
    reminderFormSchema.extend({ kind: z.literal("reminder.save") }), z.object({ kind: z.enum(["reminder.toggle", "reminder.archive"]), id: uuid, version: z.number().int().nonnegative() }),
    z.object({ kind: z.literal("notifications.bulk"), ids: z.array(uuid).min(1).max(50), action: z.enum(["read", "unread", "save", "unsave", "archive", "restore"]) }),
    z.object({ kind: z.literal("notification.open"), id: uuid }), z.object({ kind: z.literal("notification.snooze"), id: uuid, choice: z.enum(["later_today", "tomorrow", "next_study_day", "custom"]), until: z.iso.datetime({ offset: true }).optional() }), preference,
    z.object({ kind: z.literal("preference.reset"), scope: z.literal("workspace"), family: z.enum(["*", ...categories]) }), z.object({ kind: z.literal("report.request") }), z.object({ kind: z.literal("report.generate"), id: uuid }),
    z.object({ kind: z.literal("push.register"), endpoint: z.url().max(4096), p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}$/), auth: z.string().regex(/^[A-Za-z0-9_-]{22}$/), deviceName: z.string().min(1).max(80) }), z.object({ kind: z.literal("push.revoke"), id: uuid })
]);
export type NotificationCommand = z.infer<typeof notificationCommandSchema>;
export type ReminderForm = z.infer<typeof reminderFormSchema>;
export const inboxFiltersSchema = z.object({ view: z.enum(["all", "unread", "saved", "archive", "snoozed"]).default("all"), category: z.enum(["all", ...categories]).default("all"), workspace: z.union([z.enum(["all", "current"]), uuid]).default("current"), range: z.enum(["7d", "30d", "90d", "all"]).default("30d"), search: z.string().trim().max(120).default("") });
export const cursorSchema = z.object({ at: z.iso.datetime({ offset: true }), id: uuid }).nullable();
