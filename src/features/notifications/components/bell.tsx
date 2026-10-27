"use client";
import { Suspense, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/app-icon";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useNotifications } from "../hooks";
import { categoryIcons } from "../policy";
import "../notifications.css";
function BellContents({ slug, userId, workspaceId, preview = false }: {
    slug: string;
    userId: string;
    workspaceId: string;
    preview?: boolean;
}) { const ready = useSyncExternalStore(() => () => { }, () => true, () => false), { page, error, loading, refetch } = useNotifications(slug, userId, workspaceId, preview, undefined, undefined, true), base = preview ? "/preview" : `/w/${slug}`, unread = page?.counts.unread || 0; return <Popover><PopoverTrigger disabled={!ready} render={<Button variant="ghost" size="icon" aria-label={`Notifications${page ? `, ${Math.min(unread, 500)} unread` : ""}`} className="pc-shell-action-btn pc-not-bell"/>}><AppIcon icon="bell" size={18}/>{unread > 0 && <span className="pc-not-bell-count">{unread > 99 ? "99+" : unread}</span>}</PopoverTrigger><PopoverContent align="end" className="pc-not-bell-pop pc-not-theme"><header><strong>Notifications</strong><Button variant="ghost" size="icon-sm" aria-label="Notification preferences" render={<Link href={`${base}/notifications/settings`}/>}><AppIcon icon="settings" size={16}/></Button></header>{loading ? <p role="status">Loading your inbox…</p> : error ? <div><p role="alert">The inbox could not be loaded.</p><Button variant="outline" onClick={() => { void refetch(); }}>Retry</Button></div> : page?.items.length ? <div className="pc-not-bell-items">{page.items.slice(0, 4).map(n => <Link href={`${base}/notifications?notification=${n.id}`} key={n.id}><span className="pc-not-symbol"><AppIcon icon={categoryIcons[n.category]} size={17}/></span><span><strong>{n.title}</strong><small>{n.body}</small></span>{!n.readAt && <i role="img" aria-label="Unread"/>}</Link>)}</div> : <div className="pc-not-bell-empty"><AppIcon icon="bell" size={25}/><strong>No notifications yet.</strong><p>Your enabled reminders will appear here when they’re due.</p></div>}<footer><Link href={`${base}/notifications`}>Open notification center<AppIcon icon="arrow-right" size={14}/></Link></footer></PopoverContent></Popover>; }
export function NotificationBell(props: Parameters<typeof BellContents>[0]) { return <Suspense fallback={<Button variant="ghost" size="icon" disabled aria-label="Loading notifications"><AppIcon icon="bell" size={18}/></Button>}><BellContents {...props}/></Suspense>; }
