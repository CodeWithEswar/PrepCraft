import { buildPushPayload } from "@block65/webcrypto-web-push";
import type { ClaimedDelivery } from "./contracts";
export interface ProviderEnv {
    EMAIL_ENABLED?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    APP_ORIGIN?: string;
    VAPID_PUBLIC_KEY?: string;
    VAPID_PRIVATE_KEY?: string;
    VAPID_SUBJECT?: string;
}
export interface ProviderResult {
    status: "delivered" | "retry" | "failed" | "suppressed";
    code?: string;
    providerId?: string;
}
export function emailConfigured(e: ProviderEnv) { return e.EMAIL_ENABLED === "true" && !!e.RESEND_API_KEY && !!e.EMAIL_FROM && /^https:\/\/[^/]+$/.test(e.APP_ORIGIN || ""); }
export function pushConfigured(e: ProviderEnv) { return /^[A-Za-z0-9_-]{87}$/.test(e.VAPID_PUBLIC_KEY || "") && /^[A-Za-z0-9_-]{43}$/.test(e.VAPID_PRIVATE_KEY || "") && /^(https:\/\/|mailto:)/.test(e.VAPID_SUBJECT || ""); }
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export function notificationLink(d: ClaimedDelivery, origin = "") { return `${origin}/w/${d.payload.workspaceSlug}/notifications?notification=${d.payload.notificationId}`; }
export function emailTemplate(d: ClaimedDelivery, origin: string) { const title = escapeHtml(d.payload.title), body = escapeHtml(d.payload.body), href = escapeHtml(notificationLink(d, origin)), settings = escapeHtml(`${origin}/w/${d.payload.workspaceSlug}/notifications/settings`); return { subject: `PrepCraft · ${d.payload.title}`, text: `${d.payload.title}\n\n${d.payload.body}\n\nOpen your inbox: ${notificationLink(d, origin)}\n\nManage reminders: ${origin}/w/${d.payload.workspaceSlug}/notifications/settings`, html: `<!doctype html><html lang="en"><body style="margin:0;background:#f3eee8;font-family:Arial,sans-serif;color:#292724"><main style="max-width:560px;margin:32px auto;padding:32px;background:#fffcf8;border:1px solid #d9c9bc;border-radius:12px"><p style="color:#8b4a34;font-weight:600">PrepCraft</p><h1 style="font-size:23px;line-height:1.4">${title}</h1><p style="font-size:15px;line-height:1.7;white-space:pre-wrap">${body}</p><p style="margin:28px 0"><a href="${href}" style="display:inline-block;padding:13px 20px;border-radius:7px;background:#a15f4b;color:white;text-decoration:none">Open your inbox</a></p><p style="font-size:12px;color:#625b54">You enabled this reminder in PrepCraft. <a href="${settings}" style="color:#874631">Manage preferences</a></p></main></body></html>` }; }
export function classifyProvider(status: number): ProviderResult { return status === 429 || status >= 500 ? { status: "retry", code: "provider_transient" } : status === 401 || status === 403 ? { status: "failed", code: "provider_configuration" } : { status: "failed", code: "provider_rejected" }; }
export async function sendEmail(d: ClaimedDelivery, e: ProviderEnv, send: typeof fetch = fetch): Promise<ProviderResult> { if (!emailConfigured(e) || !d.email)
    return { status: "suppressed", code: "provider_unconfigured" }; const template = emailTemplate(d, e.APP_ORIGIN!); try {
    const response = await send("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": d.idempotencyKey }, body: JSON.stringify({ from: e.EMAIL_FROM, to: [d.email], ...template }), signal: AbortSignal.timeout(15000), redirect: "error" });
    if (!response.ok)
        return classifyProvider(response.status);
    const body = await response.json() as {
        id?: string;
    };
    return typeof body.id === "string" ? { status: "delivered", providerId: body.id } : { status: "retry", code: "provider_response_invalid" };
}
catch {
    return { status: "retry", code: "provider_network" };
} }
export function allowedPushEndpoint(endpoint: string) { try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && !u.username && !u.password && (!u.port || u.port === "443") && /^(fcm\.googleapis\.com|[a-z0-9-]+\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/.test(u.hostname);
}
catch {
    return false;
} }
export async function sendPush(d: ClaimedDelivery, e: ProviderEnv, accepted: (id: string) => Promise<void>, expired: (id: string) => Promise<void>, send: typeof fetch = fetch): Promise<ProviderResult> { if (!pushConfigured(e))
    return { status: "suppressed", code: "provider_unconfigured" }; if (!d.subscriptions?.length)
    return { status: "suppressed", code: "no_push_device" }; let transient = false, delivered = false, ambiguous = false; for (const subscription of d.subscriptions) {
    if (d.payload.pushAccepted?.includes(subscription.id)) {
        delivered = true;
        continue;
    }
    if (!allowedPushEndpoint(subscription.endpoint))
        continue;
    const ttl = Math.max(0, Math.min(3600, d.payload.expiresAt ? Math.floor((Date.parse(d.payload.expiresAt) - Date.now()) / 1000) : 3600));
    if (!ttl)
        continue;
    try {
        const payload = await buildPushPayload({ data: JSON.stringify({ id: d.payload.notificationId, title: d.payload.private ? "PrepCraft" : d.payload.title.slice(0, 120), body: d.payload.private ? "A preparation update is ready in your inbox." : d.payload.body.slice(0, 600), url: notificationLink(d), expiresAt: Date.now() + ttl * 1000 }), options: { ttl, topic: d.id.replaceAll("-", ""), urgency: "normal" } }, { ...subscription, expirationTime: null }, { publicKey: e.VAPID_PUBLIC_KEY!, privateKey: e.VAPID_PRIVATE_KEY!, subject: e.VAPID_SUBJECT! });
        const response = await send(subscription.endpoint, { ...payload, signal: AbortSignal.timeout(12000), redirect: "error" });
        if (response.ok) {
            await accepted(subscription.id);
            delivered = true;
        }
        else if (response.status === 404 || response.status === 410)
            await expired(subscription.id);
        else if (response.status === 429 || response.status >= 500)
            transient = true;
        else
            return { status: "failed", code: "push_rejected" };
    }
    catch {
        ambiguous = true;
    }
} if (ambiguous)
    return { status: "failed", code: "push_acceptance_unknown" }; if (transient)
    return { status: "retry", code: "push_transient" }; return delivered ? { status: "delivered" } : { status: "suppressed", code: "no_push_device" }; }
export async function verifyWebhook(body: string, headers: Headers, secret: string, now = Date.now()) { const id = headers.get("svix-id"), timestamp = headers.get("svix-timestamp"), signatures = headers.get("svix-signature"); if (!id || id.length > 160 || !timestamp || !/^[0-9]{10}$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300 || !signatures || signatures.length > 2000)
    return false; try {
    const decoded = Uint8Array.from(atob(secret.replace(/^whsec_/, "")), c => c.charCodeAt(0)), key = await crypto.subtle.importKey("raw", decoded, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]), data = new TextEncoder().encode(`${id}.${timestamp}.${body}`);
    for (const part of signatures.split(" "))
        if (part.startsWith("v1,")) {
            const signature = Uint8Array.from(atob(part.slice(3)), c => c.charCodeAt(0));
            if (await crypto.subtle.verify("HMAC", key, signature, data))
                return true;
        }
    return false;
}
catch {
    return false;
} }
