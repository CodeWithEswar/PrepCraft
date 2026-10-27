"use client";
import { useState, useSyncExternalStore } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/app-icon";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
const subscribeNarrow = (callback: () => void) => { const q = window.matchMedia("(max-width:1399px)"); q.addEventListener("change", callback); return () => q.removeEventListener("change", callback); };
import { notificationDetail, notificationPreviewReport } from "../server/actions";
import { useNotifications } from "../hooks";
import { defaultInboxFilters, categoryIcons, groupNotifications, notificationHref, deliveryLabel } from "../policy";
import { categories, type NotificationBootstrap, type NotificationItem, type InboxFilters } from "../types";
import type { NotificationCommand } from "../schema";
import { ReminderSettings } from "./settings";
import { NotificationSelect } from "./controls";
import { CustomSnooze } from "./snooze";
import { WeeklyReport } from "./report";
import "../notifications.css";
export function NotificationsPage({ initial, settingsOpen = false }: {
    initial: NotificationBootstrap;
    settingsOpen?: boolean;
}) {
    const ready = useSyncExternalStore(() => () => { }, () => true, () => false), w = initial.settings.workspace, router = useRouter(), params = useSearchParams(), [filters, setFilters] = useState<InboxFilters>(defaultInboxFilters), [selection, setSelection] = useState<string[]>([]), [selected, setSelected] = useState<string | null>(params.get("notification")), [settings, setSettings] = useState(settingsOpen), [pending, setPending] = useState(false), [error, setError] = useState(""), [extra, setExtra] = useState<NotificationItem[]>([]), [cursor, setCursor] = useState<{
        at: string;
        id: string;
    } | null>(null), [loaded, setLoaded] = useState(false), mobile = useSyncExternalStore(subscribeNarrow, () => window.matchMedia("(max-width:1399px)").matches, () => false), api = useNotifications(w.slug, w.userId!, w.id, initial.preview, initial, filters), page = api.page, base = initial.preview ? "/preview" : `/w/${w.slug}`, all = [...(page?.items || []), ...extra.filter(e => !page?.items.some(n => n.id === e.id))], item = all.find(n => n.id === selected) || (!mobile ? all.find(n => n.category === "report") : undefined), groups = groupNotifications(all, page?.context.asOf || initial.inbox.context.asOf, w.timezone);
    function updateFilters(update: (f: InboxFilters) => InboxFilters) { setSelection([]); setExtra([]); setCursor(null); setLoaded(false); setFilters(update); }
    async function run(c: NotificationCommand) { setPending(true); setError(""); try {
        return await api.command(c);
    }
    catch (e) {
        setError((e as Error).message);
        throw e;
    }
    finally {
        setPending(false);
    } }
    function bulk(action: "read" | "unread" | "save" | "unsave" | "archive" | "restore", ids = selection) { void run({ kind: "notifications.bulk", action, ids }).then(() => setSelection([])).catch(() => { }); }
    function report(id: string) { router.push(`${base}/notifications/reports/${id}`); }
    async function open(n: NotificationItem) { try {
        const r = await run({ kind: "notification.open", id: n.id });
        if (r.handled) {
            setError("This reminder has already been handled or its source changed. Its history remains available.");
            return;
        }
        const href = notificationHref(String(r.actionType), String(r.workspaceSlug), r.sourceId as string | null, initial.preview);
        if (href)
            router.push(href);
    }
    catch { } }
    const detail = item ? <NotificationContext item={item} preview={initial.preview} slug={w.slug} onOpen={() => { void open(item); }} onCommand={run}/> : <div className="pc-not-empty"><AppIcon icon="file" size={28}/><h3>A little more context.</h3><p>Select a notification to see why it arrived and choose your next step.</p></div>;
    return <div className="pc-notifications pc-not-theme"><fieldset disabled={!ready} className="pc-not-hydration"><header className="pc-not-page-header"><div><p className="pc-not-breadcrumb"><AppIcon icon="bell" size={14}/>Workspace<AppIcon icon="chevron-right" size={11}/>Notifications</p><h1>Notifications</h1><p>Stay in rhythm. A clear next step, when it matters.</p></div><div className="pc-not-header-actions"><label className="pc-not-search"><AppIcon icon="search" size={17}/><input placeholder="Search notifications…" aria-label="Search notifications" maxLength={120} value={filters.search} onChange={e => updateFilters(f => ({ ...f, search: e.target.value }))}/></label><Button variant="outline" aria-label="Preferences · reminder settings" onClick={() => setSettings(true)}><AppIcon icon="settings" size={17}/><span>Preferences</span></Button></div></header>{initial.preview && <p className="pc-not-sample"><AppIcon icon="info" size={13}/>Illustrative sample · changes stay in this preview.</p>}
 <div className="pc-not-toolbar"><nav aria-label="Inbox views" className="pc-not-tabs">{(["all", "unread", "saved", "archive", "snoozed"] as const).map(view => <Button key={view} variant="ghost" aria-pressed={filters.view === view} onClick={() => updateFilters(f => ({ ...f, view }))}>{view[0].toUpperCase() + view.slice(1)}{(page?.counts[view] || 0) > 0 && <span>{(page?.counts[view] || 0) > 500 ? "500+" : page?.counts[view]}</span>}</Button>)}</nav><div className="pc-not-filters"><NotificationSelect label="Notification type" value={filters.category} items={[{ value: "all", label: "All types" }, ...categories.map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) }))]} onChange={v => updateFilters(f => ({ ...f, category: v as InboxFilters["category"] }))}/><NotificationSelect label="Notification workspace" value={filters.workspace} items={[{ value: "current", label: "This workspace" }, { value: "all", label: "All workspaces" }, ...(api.settings?.workspaces || []).filter(x => x.id !== w.id).map(x => ({ value: x.id, label: x.name }))]} onChange={v => updateFilters(f => ({ ...f, workspace: v }))}/><NotificationSelect label="Notification date range" value={filters.range} items={[{ value: "7d", label: "Last 7 days" }, { value: "30d", label: "Last 30 days" }, { value: "90d", label: "Last 90 days" }, { value: "all", label: "All time" }]} onChange={v => updateFilters(f => ({ ...f, range: v as InboxFilters["range"] }))}/></div></div>
 <div className="pc-not-digest"><Digest icon="alert-circle" value={String(page?.attention.items ?? 0)} title="items need attention" caption="Relevant, important reminders"/><Digest icon="clock" value={String(page?.attention.revisionItems ?? 0)} title="revisions mentioned" caption="Bundled in visible reminders"/><Digest icon="bookmark" value={String(page?.counts.saved ?? 0)} title="saved for later" caption="Keep useful updates close"/><Digest icon="file" value={String(api.settings?.reports.filter(r => r.status === "ready").length ?? 0)} title="weekly reports" caption="Your preparation, with context"/></div>
 {(error || api.error) && <div className="pc-not-error" role="alert">{error || "Some notifications could not be loaded. Your saved inbox state has not changed."}<Button variant="outline" onClick={() => { setError(""); void api.refetch(); }}>Retry</Button></div>}
 <div className="pc-not-layout"><section className="pc-not-inbox" aria-label="Notification inbox" aria-busy={pending || api.loading}>{selection.length > 0 && <div className="pc-not-bulk"><strong>{selection.length} selected</strong><Button variant="ghost" onClick={() => bulk("read")} disabled={pending}>Mark read</Button><Button variant="ghost" onClick={() => bulk("save")} disabled={pending}>Save</Button><Button variant="ghost" onClick={() => bulk(filters.view === "archive" ? "restore" : "archive")} disabled={pending}>{filters.view === "archive" ? "Restore" : "Archive"}</Button><Button variant="ghost" aria-label="Clear selection" onClick={() => setSelection([])}><AppIcon icon="close" size={14}/></Button></div>}{api.loading ? <div className="pc-not-empty" role="status">Loading your inbox…</div> : all.length ? Object.entries(groups).map(([label, rows]) => <section key={label} className="pc-not-group"><header><h2>{label}</h2><small>{rows.length} {rows.length === 1 ? "notification" : "notifications"}</small></header>{rows.map(n => <article key={n.id} className="pc-not-row" data-selected={n.id === item?.id} data-unread={!n.readAt} data-handled={!!n.resolvedAt}><input type="checkbox" aria-label={`Select ${n.title}`} checked={selection.includes(n.id)} disabled={pending || selection.length >= 50 && !selection.includes(n.id)} onChange={e => setSelection(v => e.target.checked ? [...v, n.id] : v.filter(id => id !== n.id))}/><span className="pc-not-unread" role="img" aria-label={n.readAt ? "Read" : "Unread"}/><span className="pc-not-symbol" data-category={n.category}><AppIcon icon={categoryIcons[n.category]} size={20}/></span><div className="pc-not-row-content"><div className="pc-not-row-meta"><span>{n.category.replaceAll("_", " ")}</span>{n.priority === "important" && <small>Important</small>}{n.savedAt && <AppIcon icon="bookmark" size={12} label="Saved"/>}<time dateTime={n.createdAt}>{new Intl.DateTimeFormat("en-GB", { timeZone: w.timezone, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(n.createdAt))}</time></div><button className="pc-not-row-title" onClick={() => setSelected(n.id)}>{n.title}</button><p>{n.body}</p><div className="pc-not-row-footer"><span><AppIcon icon="building" size={12}/>{n.workspace.name}</span>{n.resolvedAt ? <small>Already handled</small> : n.state === "pending" ? <small>Snoozed</small> : <Button variant="outline" size="sm" onClick={() => { void open(n); }}>{n.category === "report" ? "View report" : n.category === "revision" ? "Open Revision" : "Open source"}</Button>}<DropdownMenu><DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label={`Actions for ${n.title}`}/>}><AppIcon icon="more-horizontal" size={15}/></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => bulk(n.readAt ? "unread" : "read", [n.id])}>{n.readAt ? "Mark unread" : "Mark read"}</DropdownMenuItem><DropdownMenuItem onClick={() => bulk(n.savedAt ? "unsave" : "save", [n.id])}>{n.savedAt ? "Unsave" : "Save"}</DropdownMenuItem><DropdownMenuItem onClick={() => bulk(n.archivedAt ? "restore" : "archive", [n.id])}>{n.archivedAt ? "Restore" : "Archive"}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem disabled={!!n.resolvedAt || !!n.archivedAt} onClick={() => { void run({ kind: "notification.snooze", id: n.id, choice: "later_today" }).catch(() => { }); }}>Snooze for 2 hours</DropdownMenuItem><DropdownMenuItem disabled={!!n.resolvedAt || !!n.archivedAt} onClick={() => { void run({ kind: "notification.snooze", id: n.id, choice: "tomorrow" }).catch(() => { }); }}>Tomorrow at 09:00</DropdownMenuItem><DropdownMenuItem disabled={!!n.resolvedAt || !!n.archivedAt} onClick={() => { void run({ kind: "notification.snooze", id: n.id, choice: "next_study_day" }).catch(() => { }); }}>Next study day</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div></article>)}</section>) : <div className="pc-not-empty"><AppIcon icon={filters.search ? "search" : "bell"} size={32}/><h2>{filters.search ? "No matching notifications." : filters.view === "all" ? "A quieter space to stay on track." : `Nothing in ${filters.view} yet.`}</h2><p>{filters.search ? "Try a different search or widen your filters." : "Your enabled reminders appear when they’re relevant. Choose a schedule in Preferences."}</p><Button variant="outline" onClick={() => setSettings(true)}>Manage reminders</Button></div>}{!initial.preview && (loaded ? cursor : page?.cursor) && <Button className="pc-not-full" variant="outline" disabled={pending} onClick={async () => { setPending(true); try {
        const { notificationInbox } = await import("../server/actions"), p = await notificationInbox({ slug: w.slug, filters, cursor: loaded ? cursor : page?.cursor });
        setExtra(v => [...v, ...p.items]);
        setCursor(p.cursor);
        setLoaded(true);
    }
    catch {
        setError("More notifications could not be loaded. Please retry.");
    }
    finally {
        setPending(false);
    } }}>Load more notifications</Button>}</section>
 <aside className="pc-not-context-desktop" aria-label="Notification context">{detail}</aside><aside className="pc-not-rail">{api.settings && <ReminderSettings settings={api.settings} preview={initial.preview} onCommand={run} onReport={report}/>}</aside></div>
 <Sheet open={!!selected && mobile} onOpenChange={v => { if (!v)
        setSelected(null); }}><SheetContent className="pc-not-sheet pc-not-theme"><SheetHeader><SheetTitle>Notification details</SheetTitle><SheetDescription>Why this arrived and what you can do next.</SheetDescription></SheetHeader>{detail}</SheetContent></Sheet>
 <Sheet open={settings} onOpenChange={setSettings}><SheetContent className="pc-not-sheet pc-not-theme"><SheetHeader><SheetTitle>Reminders & delivery</SheetTitle><SheetDescription>Keep the updates you need, on your terms.</SheetDescription></SheetHeader>{api.settings && <ReminderSettings settings={api.settings} preview={initial.preview} onCommand={run} onReport={report}/>}</SheetContent></Sheet>
 </fieldset></div>;
}
function Digest({ icon, value, title, caption }: {
    icon: "alert-circle" | "clock" | "bookmark" | "file";
    value: string;
    title: string;
    caption: string;
}) { return <div className="pc-not-digest-card"><span className="pc-not-symbol"><AppIcon icon={icon} size={22}/></span><div><strong>{value} {value==="1"?title.replace("items need attention","item needs attention").replace("revisions mentioned","revision mentioned").replace("weekly reports","weekly report"):title}</strong><small>{caption}</small></div></div>; }
function NotificationContext({ item: n, preview, slug, onOpen, onCommand }: {
    item: NotificationItem;
    preview: boolean;
    slug: string;
    onOpen: () => void;
    onCommand: (c: NotificationCommand) => Promise<unknown>;
}) { const detail = useQuery({ queryKey: ["notification-detail", preview ? "preview" : slug, n.id], queryFn: async () => preview ? { id: n.id, currentSource: { valid: !n.resolvedAt }, deliveries: [{ channel: "in_app", status: "delivered", providerStatus: null, scheduledFor: n.scheduledFor, deliveredAt: n.availableAt, failureCode: null }], report: n.reportId ? { id: n.reportId, status: "ready", snapshot: (await notificationPreviewReport()).snapshot || null } : null } : notificationDetail(slug, n.id), staleTime: 15000 }); return <section className="pc-not-detail"><header><span className="pc-not-symbol"><AppIcon icon={categoryIcons[n.category]} size={23}/></span><div><span className="pc-not-eyebrow">{n.category}</span><h2>{n.title}</h2></div></header>{detail.isError ? <div role="alert"><p>Context could not be loaded.</p><Button variant="outline" onClick={() => { void detail.refetch(); }}>Retry details</Button></div> : <><p>{n.body}</p><section className="pc-not-card"><h3>Why this arrived</h3><p>{n.reason}</p><small>{n.workspace.name}</small></section>{n.reportId && detail.data?.report?.snapshot && <WeeklyReport compact preview={preview} report={{ id: n.reportId, periodStart: detail.data.report.snapshot.periodStart, periodEnd: detail.data.report.snapshot.periodEnd, timezone: detail.data.report.snapshot.timezone, status: "ready", generatedAt: detail.data.report.snapshot.generatedAt, failureCode: null, attemptCount: 1, snapshot: detail.data.report.snapshot }}/>}<CustomSnooze id={n.id} disabled={!!n.resolvedAt || !!n.archivedAt || detail.data?.currentSource.valid === false} onCommand={onCommand}/><section className="pc-not-card"><h3>Delivery history</h3>{detail.isPending ? <p role="status">Loading delivery history…</p> : detail.data?.deliveries.map(d => <p key={d.channel}>{d.channel === "in_app" ? "In-app inbox" : d.channel}: {deliveryLabel(d.channel,d.status,d.providerStatus)}</p>)}<p className="pc-not-caption">Scheduled {new Date(n.scheduledFor).toISOString().slice(0, 16).replace("T", " ")} UTC{n.snoozedUntil ? ` · Snoozed until ${new Date(n.snoozedUntil).toISOString().slice(0, 16).replace("T", " ")} UTC` : ""}</p></section>{detail.data?.currentSource.valid === false || n.resolvedAt ? <p className="pc-not-caption">This reminder has already been handled or its source changed. The history remains available.</p> : <Button className="pc-not-full" onClick={onOpen}>{n.category === "report" ? "View full report" : "Continue to source"}<AppIcon icon="arrow-right" size={15}/></Button>}<Button variant="outline" className="pc-not-full" onClick={() => { void onCommand({ kind: "notifications.bulk", ids: [n.id], action: n.savedAt ? "unsave" : "save" }).catch(() => { }); }}><AppIcon icon="bookmark" size={14}/>{n.savedAt ? "Remove from saved" : "Save for later"}</Button></>}</section>; }
