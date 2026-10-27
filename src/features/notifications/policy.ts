import type { AppIconName } from "@/components/app-icon";
import type { Category, InboxFilters, InboxPage, NotificationItem, Schedule } from "./types";
/** Provider acceptance is not proof that an email or push was seen on a device. */
export function deliveryLabel(channel:string,status:string,providerStatus:string|null){if(channel==="email"){if(providerStatus==="email.delivered")return "Delivered by email provider";if(providerStatus==="email.bounced")return "Bounced";if(providerStatus==="email.complained")return "Reported as spam";if(providerStatus==="email.delivery_delayed")return "Provider delivery delayed";if(status==="delivered")return "Accepted by email provider"}if(channel==="push"&&status==="delivered")return "Accepted by push service";if(channel==="in_app"&&status==="delivered")return "Inbox delivery recorded";return status.replaceAll("_"," ")}
export const defaultInboxFilters: InboxFilters = { view: "all", category: "all", workspace: "current", range: "30d", search: "" };
export const categoryIcons: Record<Category, AppIconName> = { plan: "calendar", revision: "clock", practice: "code", interview: "user", application: "building", report: "file", workspace: "target", system: "info", custom: "bell" };
export function notificationHref(action: string, slug: string, sourceId?: string | null, preview = false) { if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug))
    return null; const base = preview ? "/preview" : `/w/${slug}`; switch (action) {
    case "view_today": return preview ? base : `${base}/today`;
    case "start_revision": return `${base}/revision`;
    case "view_weekly_plan": return `${base}/plan`;
    case "view_task": return sourceId && /^[\da-f-]{36}$/i.test(sourceId) ? `${base}/plan?task=${sourceId}` : `${base}/plan`;
    case "view_report": return sourceId && /^[\da-f-]{36}$/i.test(sourceId) ? `${base}/notifications/reports/${sourceId}` : null;
    case "view_target": return `${base}/settings`;
    case "open_workspace": return preview ? base : `${base}/today`;
    default: return null;
} }
export function scheduleLabel(s: Schedule) { const at = s.localTime?.slice(0, 5) || "", days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; return s.scheduleType === "daily" ? `Daily at ${at}` : s.scheduleType === "weekly" ? `Every ${days[s.daysOfWeek?.[0] ?? 1]} at ${at}` : s.scheduleType === "selected_days" ? `${s.daysOfWeek?.map(d => days[d]).join(", ")} at ${at}` : s.scheduleType === "once" ? `${s.localDate || s.absoluteAt?.slice(0, 10)} ${at}` : `${Math.abs(s.offsetMinutes || 0)} min before the event`; }
export function filterInbox(items: NotificationItem[], filters: InboxFilters, now: string) { const at = Date.parse(now), base = items.filter(n => (filters.workspace === "all" || filters.workspace === "current" || n.workspace.id === filters.workspace) && (filters.category === "all" || n.category === filters.category) && `${n.title} ${n.body} ${n.category} ${n.workspace.name}`.toLowerCase().includes(filters.search.toLowerCase()) && (filters.range === "all" || Date.parse(n.createdAt) >= at - Number(filters.range.slice(0, -1)) * 86400000)); const counts = { all: 0, unread: 0, saved: 0, archive: 0, snoozed: 0, bounded: true, limit: 500 }; for (const n of base) {
    if (n.state === "archived")
        counts.archive++;
    else if (n.state === "pending" && n.snoozedUntil)
        counts.snoozed++;
    else if (n.state !== "pending") {
        counts.all++;
        if (!n.readAt)
            counts.unread++;
        if (n.savedAt)
            counts.saved++;
    }
} return { items: base.filter(n => filters.view === "archive" ? n.state === "archived" : filters.view === "snoozed" ? n.state === "pending" && !!n.snoozedUntil : n.state !== "pending" && n.state !== "archived" && (filters.view !== "unread" || !n.readAt) && (filters.view !== "saved" || !!n.savedAt)), counts } satisfies Pick<InboxPage, "items" | "counts">; }
export function groupNotifications(items: NotificationItem[], now: string, timezone: string) { const day = (v: string) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(v)); const today = day(now), yesterday = day(new Date(Date.parse(now) - 86400000).toISOString()); return items.reduce<Record<string, NotificationItem[]>>((a, n) => { const d = day(n.createdAt), key = d === today ? "Today" : d === yesterday ? "Yesterday" : "Earlier"; (a[key] ??= []).push(n); return a; }, {}); }
