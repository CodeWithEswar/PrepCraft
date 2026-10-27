"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { reminderFormSchema, type ReminderForm, type NotificationCommand } from "../schema";
import type { Reminder, NotificationSettings } from "../types";
import { notificationSchedulePreview } from "../server/actions";
import { NotificationSelect } from "./controls";
const types = [{ value: "custom", label: "Custom reminder" }, { value: "daily_plan", label: "Daily plan" }, { value: "revision_due", label: "Revision due" }, { value: "weekly_target", label: "Weekly plan review" }, { value: "weekly_report", label: "Weekly report" }, { value: "upcoming_session", label: "Planned session" }, { value: "target_deadline", label: "Target date" }];
export function ReminderEditor({ reminder, settings, preview, open, onClose, onSave }: {
    reminder: Reminder | null;
    settings: NotificationSettings;
    preview: boolean;
    open: boolean;
    onClose: () => void;
    onSave: (c: NotificationCommand) => Promise<unknown>;
}) {
    const [error, setError] = useState(""), [next, setNext] = useState(""), { register, handleSubmit, control, setValue, getValues, formState: { errors, isSubmitting } } = useForm<ReminderForm>({ resolver: zodResolver(reminderFormSchema), defaultValues: reminder ? { ...reminder, schedule: { ...reminder.schedule, localTime: reminder.schedule.localTime?.slice(0, 5) } } : { type: "custom", title: "", body: "", sourceType: "workspace", sourceId: null, priority: "normal", channels: ["in_app"], enabled: true, respectQuietHours: true, schedule: { scheduleType: "daily", timezone: settings.workspace.timezone, localTime: "09:00" } } });
    const values = useWatch({ control }) as ReminderForm, schedule = values.schedule, type = values.type, channels = values.channels;
    function changeType(value: ReminderForm["type"]) { setValue("type", value); setValue("sourceType", value === "upcoming_session" ? "task" : value === "target_deadline" ? "target" : "workspace"); setValue("sourceId", value === "target_deadline" ? settings.workspace.id : null); setValue("respectQuietHours", true); setValue("schedule", { scheduleType: ["target_deadline", "upcoming_session"].includes(value) ? "event_relative" : value === "weekly_report" ? "weekly" : "daily", timezone: settings.workspace.timezone, ...(["target_deadline", "upcoming_session"].includes(value) ? { offsetMinutes: -30 } : value === "weekly_report" ? { localTime: "08:00", daysOfWeek: [1] } : { localTime: "09:00" }) }); if (!getValues("title"))
        setValue("title", types.find(t => t.value === value)?.label || ""); setNext(""); }
    async function checkSchedule() { setError(""); if (preview) {
        setNext("Sample schedule only. Sign in to calculate and save the next occurrence.");
        return;
    } try {
        const v = getValues(), p = await notificationSchedulePreview({ slug: settings.workspace.slug, schedule: v.schedule, sourceType: v.sourceType, sourceId: v.sourceId });
        setNext(p.nextRunAt ? `Next: ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: v.schedule.timezone }).format(new Date(p.nextRunAt))} · ${p.timezone}` : "No future occurrence. Choose a later time.");
    }
    catch (e) {
        setError((e as Error).message);
    } }
    return <Dialog open={open} onOpenChange={v => { if (!v)
        onClose(); }}><DialogContent className="pc-not-modal pc-not-theme"><DialogHeader><DialogTitle>{reminder ? "Edit reminder" : "Create a reminder"}</DialogTitle><DialogDescription>A clear nudge, at a time that works for you.</DialogDescription></DialogHeader><form className="pc-not-form" onSubmit={handleSubmit(async (v) => { setError(""); try {
        await onSave({ ...v, kind: "reminder.save" });
        onClose();
    }
    catch (e) {
        setError((e as Error).message);
    } })}><label>Reminder type<NotificationSelect label="Reminder type" value={type} items={types.filter(t => t.value !== "upcoming_session" || settings.relatedTasks.length).filter(t => t.value !== "target_deadline" || settings.targetAvailable)} onChange={v => changeType(v as ReminderForm["type"])}/></label><label>Title<input {...register("title")} maxLength={160} aria-invalid={!!errors.title}/>{errors.title && <small role="alert">{errors.title.message}</small>}</label>{type === "custom" && <label>Reminder note<textarea {...register("body")} maxLength={1000} rows={3}/></label>}{type === "upcoming_session" && <label>Scheduled task<NotificationSelect label="Scheduled task" value={values.sourceId || ""} items={settings.relatedTasks.map(t => ({ value: t.id, label: t.title }))} onChange={v => setValue("sourceId", v)}/></label>}
 <div className="pc-not-form-pair"><label>Repeat<NotificationSelect label="Repeat" value={schedule.scheduleType} items={(type === "weekly_report" ? ["weekly"] : ["upcoming_session", "target_deadline"].includes(type) ? ["event_relative"] : ["once", "daily", "weekly", "selected_days"]).map(value => ({ value, label: value.replaceAll("_", " ") }))} onChange={v => { setValue("schedule", { scheduleType: v as typeof schedule.scheduleType, timezone: schedule.timezone, ...(v === "event_relative" ? { offsetMinutes: -30 } : v === "once" ? { localDate: "", localTime: "09:00" } : v === "weekly" || v === "selected_days" ? { localTime: "09:00", daysOfWeek: [1] } : { localTime: "09:00" }) }); setNext(""); }}/></label><label>Timezone<input {...register("schedule.timezone")} placeholder="Asia/Calcutta" aria-invalid={!!errors.schedule?.timezone}/></label></div>
 {schedule.scheduleType === "event_relative" ? <label>Minutes before<input type="number" min={0} max={10080} value={Math.abs(schedule.offsetMinutes || 0)} onChange={e => setValue("schedule.offsetMinutes", -Number(e.target.value))}/></label> : <div className="pc-not-form-pair">{schedule.scheduleType === "once" && <label>Date<input type="date" {...register("schedule.localDate")}/></label>}<label>Local time<input type="time" {...register("schedule.localTime")}/></label></div>}
 {["weekly", "selected_days"].includes(schedule.scheduleType) && <fieldset className="pc-not-weekdays"><legend>Days</legend>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => <Button type="button" key={d} variant="outline" aria-pressed={schedule.daysOfWeek?.includes(i) || false} onClick={() => setValue("schedule.daysOfWeek", schedule.scheduleType === "weekly" ? [i] : schedule.daysOfWeek?.includes(i) ? schedule.daysOfWeek.filter(v => v !== i) : [...(schedule.daysOfWeek || []), i])}>{d}</Button>)}</fieldset>}
 <fieldset className="pc-not-channels"><legend>Deliver to</legend>{(["in_app", "email", "push"] as const).map(c => <label key={c}><input type="checkbox" checked={channels.includes(c)} disabled={c !== "in_app" && !settings.capabilities[c] && !channels.includes(c)} onChange={e => setValue("channels", e.target.checked ? [...channels, c] : channels.filter(v => v !== c))}/>{c === "in_app" ? "In-app inbox" : c === "email" ? "Email · not configured" : "Browser push"}</label>)}</fieldset>
 <label className="pc-not-toggle">Respect quiet hours<Switch checked={values.respectQuietHours} disabled={type !== "custom"} onCheckedChange={v => setValue("respectQuietHours", v)}/></label><p className="pc-not-caption">Local schedules keep their wall-clock time. Spring gaps shift forward; fall folds run once at the later instant.{type === "weekly_report" ? " Reports cover the last complete Monday–Sunday, even with a Sunday reminder." : ""}</p>
 {Object.keys(errors).length > 0 && <p role="alert" className="pc-not-error">{Object.values(errors).map(e => e.message).filter(Boolean).join(" ") || "Check the schedule, weekday selection, and delivery channels."}</p>}{error && <p role="alert" className="pc-not-error">{error}</p>}{next && <p role="status">{next}</p>}<div className="pc-not-actions"><Button type="button" variant="outline" onClick={checkSchedule}>Check next occurrence</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save reminder"}</Button></div>{reminder && <Button type="button" variant="ghost" disabled={isSubmitting} onClick={async () => { try {
        await onSave({ kind: "reminder.archive", id: reminder.id, version: reminder.version });
        onClose();
    }
    catch (e) {
        setError((e as Error).message);
    } }}>Archive reminder</Button>}</form></DialogContent></Dialog>;
}
