"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AppIcon } from "@/components/app-icon";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { NotificationSettings, Reminder, Preferences } from "../types";
import type { NotificationCommand } from "../schema";
import { scheduleLabel } from "../policy";
import { ReminderEditor } from "./reminder-editor";
import { NotificationSelect } from "./controls";
export function ReminderSettings({ settings: s, preview, onCommand, onReport }: {
    settings: NotificationSettings;
    preview: boolean;
    onCommand: (c: NotificationCommand) => Promise<unknown>;
    onReport: (id: string) => void;
}) {
    const [editing, setEditing] = useState<Reminder | null | undefined>(), [quiet, setQuiet] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
    async function run(c: NotificationCommand) { setError(""); setBusy(true); try {
        return await onCommand(c);
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function push() { setError(""); if (preview) {
        setError("Browser permission is available in your signed-in workspace. This preview does not register devices.");
        return;
    } if (!s.capabilities.push || !s.capabilities.pushPublicKey) {
        setError("Browser push is not configured yet.");
        return;
    } try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !window.isSecureContext)
            throw Error("This browser needs HTTPS and Web Push support.");
        const permission = await Notification.requestPermission();
        if (permission !== "granted")
            throw Error(permission === "denied" ? "Notifications are blocked in browser settings. You can change the permission there." : "Permission was not granted. Your in-app inbox remains available.");
        const registration = await navigator.serviceWorker.register("/notification-sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        const raw = atob(s.capabilities.pushPublicKey.replace(/-/g, "+").replace(/_/g, "/")), key = Uint8Array.from(raw, c => c.charCodeAt(0)), subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }), json = subscription.toJSON();
        if (!json.endpoint || !json.keys)
            throw Error("The subscription could not be created.");
        await onCommand({ kind: "push.register", endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, deviceName: "This browser" });
        await onCommand({ kind: "preference.save", scope: "workspace", family: "*", ...s.effective, push: true });
    }
    catch (e) {
        setError((e as Error).message);
    } }
    return <div className="pc-not-settings"><section className="pc-not-card"><header><h2>Reminder settings</h2><Button variant="ghost" size="icon-sm" aria-label="Create reminder" disabled={!s.workspace.canEdit || busy} onClick={() => setEditing(null)}><AppIcon icon="plus" size={17}/></Button></header>{s.reminders.filter(r => !r.archivedAt).map(r => <div className="pc-not-reminder" key={r.id}><span className="pc-not-symbol"><AppIcon icon={r.type === "weekly_report" ? "file" : r.type === "daily_plan" ? "calendar" : "clock"} size={18}/></span><button className="pc-not-text-button" onClick={() => setEditing(r)}><strong>{r.title}</strong><small>{scheduleLabel(r.schedule)}</small><small>{r.schedule.timezone}{!r.enabled ? " · paused" : ""}</small></button><Switch aria-label={`Enable ${r.title}`} checked={r.enabled} disabled={!s.workspace.canEdit || busy} onCheckedChange={() => { void run({ kind: "reminder.toggle", id: r.id, version: r.version }); }}/></div>)}{!s.reminders.some(r => !r.archivedAt) && <p className="pc-not-caption">Choose your first reminder. Notifications are created from your schedule and current preparation records.</p>}<Button variant="outline" className="pc-not-full" disabled={!s.workspace.canEdit} onClick={() => setEditing(null)}><AppIcon icon="plus" size={14}/>Create reminder</Button></section>
 <section className="pc-not-card"><header><span className="pc-not-symbol"><AppIcon icon="moon" size={20}/></span><h2>Quiet hours</h2><Switch aria-label="Enable quiet hours" checked={s.effective.quietEnabled} disabled={busy} onCheckedChange={quietEnabled => { void run({ kind: "preference.save", scope: "workspace", family: "*", ...s.effective, quietEnabled }); }}/></header><p>{s.effective.quietStart.slice(0, 5)} – {s.effective.quietEnd.slice(0, 5)}</p><small>{s.effective.timezone}</small><p className="pc-not-caption">Reminders wait until quiet hours end. Your original scheduled time stays in the history.</p><Button variant="outline" size="sm" onClick={() => setQuiet(true)}>Edit preferences<AppIcon icon="arrow-right" size={13}/></Button></section>
 <section className="pc-not-card"><h2>Delivery channels</h2><div className="pc-not-channel-state"><AppIcon icon="bell" size={17}/><span>In-app inbox</span><small>{s.effective.inApp ? "Enabled" : "Paused"}</small></div><div className="pc-not-channel-state"><AppIcon icon="file" size={17}/><span>Email</span><small>{s.capabilities.email ? "Available" : "Not configured"}</small></div><p className="pc-not-caption">{s.capabilities.email ? "Email is sent only when enabled in your preferences and reminder." : "Email delivery is a placeholder until a provider and verified sender are configured."}</p><Button variant="outline" className="pc-not-full" onClick={push} disabled={busy || !s.capabilities.push && !preview}>Enable this browser<AppIcon icon="bell" size={14}/></Button>{s.devices.filter(d => !d.revokedAt).map(d => <div className="pc-not-device" key={d.id}><span><strong>{d.name}</strong><small>{d.provider}</small></span><Button variant="ghost" aria-label={`Remove ${d.name}`} onClick={() => { void run({ kind: "push.revoke", id: d.id }); }}>Remove</Button></div>)}<p className="pc-not-caption">Push is opt-in. Private previews hide preparation details on your lock screen.</p></section>
 <section className="pc-not-card"><header><h2>Weekly reports</h2><AppIcon icon="file" size={18}/></header><p className="pc-not-caption">One snapshot of your recorded preparation, with source coverage and clear evidence limits.</p><Button variant="outline" className="pc-not-full" disabled={busy || !s.workspace.canEdit} onClick={async () => { if (preview) {
        onReport("10000000-0000-4000-8000-000000000090");
        return;
    } const result = await run({ kind: "report.request" }) as {
        reportId?: string;
    } | undefined; if (result?.reportId) {
        await run({ kind: "report.generate", id: result.reportId });
        onReport(result.reportId);
    } }}>{busy ? "Preparing…" : "Prepare last week’s report"}</Button>{s.reports.map(r => <button className="pc-not-report-link" key={r.id} onClick={() => onReport(r.id)}><span>{r.periodStart} – {r.periodEnd}</span><small>{r.status}</small><AppIcon icon="chevron-right" size={13}/></button>)}</section>{error && <p role="alert" className="pc-not-error">{error}</p>}
 {editing !== undefined && <ReminderEditor key={editing?.id || "new"} reminder={editing} settings={s} preview={preview} open onClose={() => setEditing(undefined)} onSave={onCommand}/>}
 <Sheet open={quiet} onOpenChange={setQuiet}><SheetContent className="pc-not-sheet pc-not-theme"><SheetHeader><SheetTitle>Notification preferences</SheetTitle><SheetDescription>Choose your scope, quiet hours, and delivery channels.</SheetDescription></SheetHeader><PreferencesForm settings={s} onSave={onCommand}/></SheetContent></Sheet>
 </div>;
}
type PreferenceForm = Preferences & {
    scope: "account" | "workspace";
    family: "*" | "revision" | "plan" | "report" | "custom";
};
function PreferencesForm({ settings: s, onSave }: {
    settings: NotificationSettings;
    onSave: (c: NotificationCommand) => Promise<unknown>;
}) { const { register, control, setValue, handleSubmit, formState: { isSubmitting } } = useForm<PreferenceForm>({ defaultValues: { ...s.effective, quietStart: s.effective.quietStart.slice(0, 5), quietEnd: s.effective.quietEnd.slice(0, 5), scope: "workspace", family: "*" } }), [message, setMessage] = useState(""), [failed, setFailed] = useState(false), values = useWatch({ control }) as PreferenceForm; return <form className="pc-not-form" onSubmit={handleSubmit(async (v) => { setMessage(""); setFailed(false); try {
    await onSave({ kind: "preference.save", ...v });
    setMessage("Preferences saved.");
}
catch (e) {
    setFailed(true);
    setMessage((e as Error).message);
} })}><label>Apply to<NotificationSelect label="Preference scope" value={values.scope} items={[{ value: "workspace", label: "This workspace" }, { value: "account", label: "Account default" }]} onChange={v => setValue("scope", v as "account" | "workspace")}/></label><label>Reminder category<NotificationSelect label="Preference category" value={values.family} items={[{ value: "*", label: "All categories" }, { value: "revision", label: "Revision" }, { value: "plan", label: "Plan" }, { value: "report", label: "Reports" }, { value: "custom", label: "Custom" }]} onChange={v => setValue("family", v as "*")}/></label><p className="pc-not-caption">Workspace category overrides take priority, followed by workspace defaults, account preferences, then product defaults. Quiet hours use the “All categories” preference.</p>{(["inApp", "email", "push", "quietEnabled"] as const).map(k => <label className="pc-not-toggle" key={k}>{({ inApp: "In-app inbox", email: "Email", push: "Browser push", quietEnabled: "Quiet hours" })[k]}<Switch checked={values[k]} disabled={(k === "email" && !s.capabilities.email || k === "push" && !s.capabilities.push) && !values[k]} onCheckedChange={v => setValue(k, v)}/></label>)}<div className="pc-not-form-pair"><label>Quiet hours start<input type="time" required {...register("quietStart")}/></label><label>Quiet hours end<input type="time" required {...register("quietEnd")}/></label></div><label>IANA timezone<input required {...register("timezone")} placeholder="Asia/Calcutta"/></label><label>Push preview<NotificationSelect label="Push preview privacy" value={values.pushPrivacy} items={[{ value: "private", label: "Private · hide preparation details" }, { value: "detailed", label: "Show reminder title and note" }]} onChange={v => setValue("pushPrivacy", v as "private" | "detailed")}/></label>{message && <p role={failed ? "alert" : "status"} className={failed ? "pc-not-error" : ""}>{message}</p>}<Button disabled={isSubmitting} type="submit">Save preferences</Button>{values.scope === "workspace" && <Button type="button" variant="outline" onClick={async () => { try {
    await onSave({ kind: "preference.reset", scope: "workspace", family: values.family });
    setFailed(false);
    setMessage("Workspace override removed. Inherited preferences now apply.");
}
catch (e) {
    setFailed(true);
    setMessage((e as Error).message);
} }}>Use inherited preferences</Button>}</form>; }
