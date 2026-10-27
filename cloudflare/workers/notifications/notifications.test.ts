// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { notificationJobSchema, deliverySchema } from "./contracts";
import { allowedPushEndpoint, classifyProvider, emailConfigured, pushConfigured, emailTemplate, sendEmail, sendPush, verifyWebhook } from "./providers";
import { consume, dispatch, webhook, type NotificationEnv } from "./index";
const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const job = { version: 1, type: "notification.job", eventId: id(1), occurredAt: "2026-10-26T00:00:00Z", workspaceId: id(2), userId: id(3), correlationId: id(1), idempotencyKey: `delivery:${id(4)}`, payload: { kind: "delivery", id: id(4) } };
const delivery = { state: "claimed" as const, id: id(4), channel: "email" as const, leaseToken: id(5), attempt: 1, idempotencyKey: `delivery:${id(4)}`, email: "verified@example.test", payload: { notificationId: id(6), workspaceSlug: "preparation", title: "<script>private & title</script>", body: "Do not log this note.", actionType: "view_today", sourceId: null, reportId: null, private: true, expiresAt: null }, subscriptions: null };
const env = (): NotificationEnv => ({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "private-test-key", EMAIL_ENABLED: "false", NOTIFICATION_DELIVERY: { send: vi.fn().mockResolvedValue(undefined) } as unknown as NotificationEnv["NOTIFICATION_DELIVERY"], NOTIFICATION_REPORTS: { send: vi.fn().mockResolvedValue(undefined) } as unknown as NotificationEnv["NOTIFICATION_REPORTS"] });
describe("notification worker contracts", () => {
    it("uses strict, versioned identifiers-only queue envelopes", () => { expect(notificationJobSchema.safeParse(job).success).toBe(true); for (const invalid of [{ ...job, version: 2 }, { ...job, body: "private" }, { ...job, payload: { ...job.payload, email: "private@example.test" } }, { ...job, payload: { kind: "sms", id: id(4) } }])
        expect(notificationJobSchema.safeParse(invalid).success).toBe(false); });
    it("validates delivery provider context before use", () => { expect(deliverySchema.safeParse(delivery).success).toBe(true); expect(deliverySchema.safeParse({ ...delivery, email: "invalid" }).success).toBe(false); });
    it.each(["https://fcm.googleapis.com/fcm/send/device", "https://updates.push.services.mozilla.com/wpush/v2/device", "https://web.push.apple.com/device", "https://wns2.notify.windows.com/device"])("allows known HTTPS push host %s", endpoint => expect(allowedPushEndpoint(endpoint)).toBe(true));
    it.each(["http://fcm.googleapis.com/device", "https://fcm.googleapis.com.evil.test/device", "https://user:password@fcm.googleapis.com/device", "https://127.0.0.1/device", "https://fcm.googleapis.com:8443/device", "https://metadata.google.internal/device"])("rejects push endpoint %s", endpoint => expect(allowedPushEndpoint(endpoint)).toBe(false));
    it("requires complete explicit provider configuration", () => { expect(emailConfigured({ RESEND_API_KEY: "test", EMAIL_FROM: "test" })).toBe(false); expect(emailConfigured({ EMAIL_ENABLED: "true", RESEND_API_KEY: "test", EMAIL_FROM: "test", APP_ORIGIN: "http://localhost:3031" })).toBe(false); expect(pushConfigured({})).toBe(false); });
    it("escapes private text in accessible email templates", () => { const t = emailTemplate(delivery, "https://preparation.test"); expect(t.html).not.toContain("<script>"); expect(t.html).toContain("&lt;script&gt;"); expect(t.text).toContain(delivery.payload.body); expect(t.html).toContain("Manage preferences"); expect(t.html).not.toContain(delivery.email); });
    it.each([429, 500, 503])("retries only a transient provider response %s", status => expect(classifyProvider(status).status).toBe("retry"));
    it.each([400, 401, 403, 422])("terminates invalid provider responses %s", status => expect(classifyProvider(status).status).toBe("failed"));
    it("does not invoke an unconfigured email provider", async () => { const send = vi.fn(); expect((await sendEmail(delivery, {}, send)).status).toBe("suppressed"); expect(send).not.toHaveBeenCalled(); });
    it("uses stable provider idempotency keys on retry", async () => { const send = vi.fn().mockResolvedValue(Response.json({ id: "provider-accepted" })); expect(await sendEmail(delivery, { EMAIL_ENABLED: "true", RESEND_API_KEY: "private", EMAIL_FROM: "PrepCraft <verified@example.test>", APP_ORIGIN: "https://preparation.test" }, send)).toEqual({ status: "delivered", providerId: "provider-accepted" }); expect(send.mock.calls[0][1].headers["Idempotency-Key"]).toBe(delivery.idempotencyKey); });
    it("validates Svix signatures and replay time before reading events", async () => { const now = Date.now(), timestamp = String(Math.floor(now / 1000)), body = '{"type":"email.delivered"}', raw = crypto.getRandomValues(new Uint8Array(32)), key = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`event-id.${timestamp}.${body}`))), secret = `whsec_${btoa(String.fromCharCode(...raw))}`, headers = new Headers({ "svix-id": "event-id", "svix-timestamp": timestamp, "svix-signature": `v1,${btoa(String.fromCharCode(...signature))}` }); expect(await verifyWebhook(body, headers, secret, now)).toBe(true); expect(await verifyWebhook(body + " ", headers, secret, now)).toBe(false); expect(await verifyWebhook(body, headers, secret, now + 301000)).toBe(false); });
    it("rejects public webhook requests without signatures", async () => { expect((await webhook(new Request("https://worker.test/webhooks/resend", { method: "POST", body: "{}" }), { ...env(), RESEND_WEBHOOK_SECRET: "whsec_test" })).status).toBe(401); });
    it("bounds webhook bodies even when Content-Length is omitted", async () => { expect((await webhook(new Request("https://worker.test/webhooks/resend", { method: "POST", body: "x".repeat(16001) }), { ...env(), RESEND_WEBHOOK_SECRET: "whsec_test" })).status).toBe(413); });
    it("encrypts real Web Push payloads and persists successful device submission", async () => { const vapid = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]), client = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]), vapidPublic = new Uint8Array(await crypto.subtle.exportKey("raw", vapid.publicKey)), clientPublic = new Uint8Array(await crypto.subtle.exportKey("raw", client.publicKey)), privateKey = await crypto.subtle.exportKey("jwk", vapid.privateKey), b64 = (v: Uint8Array) => btoa(String.fromCharCode(...v)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""), e = { VAPID_PUBLIC_KEY: b64(vapidPublic), VAPID_PRIVATE_KEY: privateKey.d!, VAPID_SUBJECT: "https://worker.example.test" }, d = { ...delivery, channel: "push" as const, subscriptions: [{ id: id(20), endpoint: "https://fcm.googleapis.com/fcm/send/example", keys: { p256dh: b64(clientPublic), auth: b64(crypto.getRandomValues(new Uint8Array(16))) } }] }, accepted = vi.fn().mockResolvedValue(undefined), expired = vi.fn().mockResolvedValue(undefined), send = vi.fn().mockResolvedValue(new Response(null, { status: 201 })); expect(await sendPush(d, e, accepted, expired, send)).toEqual({ status: "delivered" }); expect(accepted).toHaveBeenCalledWith(id(20)); expect(send.mock.calls[0][1].body.byteLength).toBe(4096); expect(new TextDecoder().decode(send.mock.calls[0][1].body)).not.toContain(delivery.payload.body); expect(send.mock.calls[0][1].headers.topic).toBe(d.id.replaceAll("-", "")); send.mockResolvedValueOnce(new Response(null, { status: 410 })); expect((await sendPush(d, e, accepted, expired, send)).status).toBe("suppressed"); expect(expired).toHaveBeenCalledWith(id(20)); send.mockClear(); expect((await sendPush({ ...d, payload: { ...d.payload, pushAccepted: [id(20)] } }, e, accepted, expired, send)).status).toBe("delivered"); expect(send).not.toHaveBeenCalled(); });
    it("publishes identifiers then acknowledges the durable outbox", async () => { const e = env(), commands: Record<string, unknown>[] = []; vi.stubGlobal("fetch", vi.fn(async (_url, init) => { const c = JSON.parse(init!.body as string).p_command; commands.push(c); return Response.json(c.kind === "outbox.claim" ? [{ id: id(1), kind: "delivery", entityId: id(4), workspaceId: id(2), userId: id(3), leaseToken: id(5), idempotencyKey: `delivery:${id(4)}`, createdAt: job.occurredAt }] : { ok: true }); })); try {
        await dispatch(e);
        expect(e.NOTIFICATION_DELIVERY.send).toHaveBeenCalledOnce();
        expect(commands.map(c => c.kind)).toEqual(["dispatch", "heartbeat", "outbox.claim", "outbox.ack"]);
        const sent = vi.mocked(e.NOTIFICATION_DELIVERY.send).mock.calls[0][0];
        expect(notificationJobSchema.safeParse(sent).success).toBe(true);
        expect(JSON.stringify(sent)).not.toContain(delivery.payload.body);
    }
    finally {
        vi.unstubAllGlobals();
    } });
    it("durably defers quiet hours without burning queue retries", async () => { const commands: string[] = [], message = { body: job, attempts: 1, ack: vi.fn(), retry: vi.fn() }; vi.stubGlobal("fetch", vi.fn(async (_url, init) => { const c = JSON.parse(init!.body as string).p_command; commands.push(c.kind); return Response.json(c.kind === "delivery.claim" ? { state: "wait", delay: 7200 } : { ok: true }); })); try {
        await consume({ queue: "prepcraft-notification-delivery", messages: [message] } as unknown as Parameters<typeof consume>[0], env());
        expect(commands).toEqual(["delivery.claim", "delivery.defer"]);
        expect(message.ack).toHaveBeenCalledOnce();
        expect(message.retry).not.toHaveBeenCalled();
    }
    finally {
        vi.unstubAllGlobals();
    } });
    it("records exhausted work from a dead letter queue", async () => { const message = { body: job, attempts: 1, ack: vi.fn(), retry: vi.fn() }, send = vi.fn().mockResolvedValue(Response.json({ ok: true })); vi.stubGlobal("fetch", send); try {
        await consume({ queue: "prepcraft-notification-delivery-dlq", messages: [message] } as unknown as Parameters<typeof consume>[0], env());
        expect(JSON.parse(send.mock.calls[0][1].body).p_command.kind).toBe("dead_letter");
        expect(message.ack).toHaveBeenCalledOnce();
    }
    finally {
        vi.unstubAllGlobals();
    } });
});
