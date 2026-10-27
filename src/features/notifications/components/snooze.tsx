"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AppIcon } from "@/components/app-icon";
import type { NotificationCommand } from "../schema";
export function CustomSnooze({ id, disabled, onCommand }: {
    id: string;
    disabled: boolean;
    onCommand: (c: NotificationCommand) => Promise<unknown>;
}) { const [open, setOpen] = useState(false), [until, setUntil] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false); return <><Button variant="outline" className="pc-not-full" disabled={disabled} onClick={() => setOpen(true)}><AppIcon icon="clock" size={14}/>Choose a snooze time</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="pc-not-modal pc-not-theme"><DialogHeader><DialogTitle>Snooze this reminder</DialogTitle><DialogDescription>Keep the original occurrence and return to it at a better time.</DialogDescription></DialogHeader><form className="pc-not-form" onSubmit={async (e) => { e.preventDefault(); setError(""); setBusy(true); try {
    const at = new Date(until);
    if (!Number.isFinite(at.getTime()) || at.getTime() < Date.now() + 300000 || at.getTime() > Date.now() + 30 * 86400000)
        throw Error("Choose a time from 5 minutes to 30 days ahead.");
    await onCommand({ kind: "notification.snooze", id, choice: "custom", until: at.toISOString() });
    setOpen(false);
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} }}><label>Date and time<input type="datetime-local" required value={until} onChange={e => setUntil(e.target.value)}/></label><p className="pc-not-caption">This input uses your device timezone. Quiet hours can move delivery later. An expired source cannot be snoozed beyond its useful window.</p>{error && <p className="pc-not-error" role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy ? "Saving…" : "Snooze reminder"}</Button></form></DialogContent></Dialog></>; }
