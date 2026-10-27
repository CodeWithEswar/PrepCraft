import { withSentry } from "@sentry/cloudflare";
import { workerMonitoring,type WorkerMonitoringEnv } from "../../shared/observability/sentry";
import type { Queue, MessageBatch, ScheduledController } from "@cloudflare/workers-types";
import { notificationJobSchema, outboxSchema, deliverySchema, type NotificationJob } from "./contracts";
import { sendEmail, sendPush, emailConfigured, pushConfigured, verifyWebhook, type ProviderEnv } from "./providers";
import { createWorkerLogger } from "../../shared/observability/structured-logger";
export interface NotificationEnv extends ProviderEnv,WorkerMonitoringEnv {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    RESEND_WEBHOOK_SECRET?: string;
    NOTIFICATION_DELIVERY: Queue<NotificationJob>;
    NOTIFICATION_REPORTS: Queue<NotificationJob>;
}
const log = createWorkerLogger({ worker: "prepcraft-notifications" });
export async function notificationRpc(e: NotificationEnv, command: Record<string, unknown>, send: typeof fetch = fetch): Promise<unknown> { if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(e.SUPABASE_URL))
    throw Error("invalid_backend_configuration"); const response = await send(`${e.SUPABASE_URL}/rest/v1/rpc/notification_worker`, { method: "POST", headers: { apikey: e.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_command: command }), signal: AbortSignal.timeout(20000) }); if (!response.ok)
    throw Error("backend_unavailable"); return response.json(); }
export async function dispatch(e: NotificationEnv) { const start = Date.now(); await notificationRpc(e, { kind: "dispatch" }); await notificationRpc(e, { kind: "heartbeat", email: emailConfigured(e), push: pushConfigured(e), pushPublicKey: pushConfigured(e) ? e.VAPID_PUBLIC_KEY : null }); const jobs = outboxSchema.parse(await notificationRpc(e, { kind: "outbox.claim" })); for (let i = 0; i < jobs.length; i += 5)
    await Promise.all(jobs.slice(i, i + 5).map(async (job) => { const envelope: NotificationJob = { version: 1, type: "notification.job", eventId: job.id, occurredAt: job.createdAt, workspaceId: job.workspaceId, userId: job.userId, correlationId: job.id, idempotencyKey: job.idempotencyKey, payload: { id: job.entityId, kind: job.kind } }; await (job.kind === "delivery" ? e.NOTIFICATION_DELIVERY : e.NOTIFICATION_REPORTS).send(envelope); await notificationRpc(e, { kind: "outbox.ack", id: job.id, leaseToken: job.leaseToken }); })); log.info("dispatch_completed", { operation: "dispatch", durationMs: Date.now() - start, count: jobs.length, outcome: "success" }); }
export async function consume(batch: MessageBatch<unknown>, e: NotificationEnv) { for (const message of batch.messages) {
    const parsed = notificationJobSchema.safeParse(message.body);
    if (!parsed.success) {
        log.warn("invalid_queue_envelope", { operation: "consume", queue: batch.queue, outcome: "terminal_failure", errorCategory: "invalid_envelope" });
        message.ack();
        continue;
    }
    const job = parsed.data;
    try {
        if (batch.queue.endsWith("-dlq")) {
            await notificationRpc(e, { kind: "dead_letter", entityType: job.payload.kind, id: job.payload.id });
            message.ack();
            continue;
        }
        if (job.payload.kind === "report") {
            const r = await notificationRpc(e, { kind: "report.run", id: job.payload.id }) as {
                state: string;
            };
            if (r.state === "failed" || r.state === "busy")
                message.retry({ delaySeconds: Math.min(900, 30 * 2 ** message.attempts) });
            else
                message.ack();
            continue;
        }
        const d = deliverySchema.parse(await notificationRpc(e, { kind: "delivery.claim", id: job.payload.id }));
        if (d.state === "done") {
            message.ack();
            continue;
        }
        if (d.state === "wait") {
            await notificationRpc(e, { kind: "delivery.defer", id: job.payload.id, delay: d.delay });
            message.ack();
            continue;
        }
        const result = d.channel === "email" ? await sendEmail(d, e) : await sendPush(d, e, async (subscriptionId) => { await notificationRpc(e, { kind: "push.accepted", id: d.id, leaseToken: d.leaseToken, subscriptionId }); }, async (id) => { await notificationRpc(e, { kind: "push.expired", id, deliveryId: d.id, leaseToken: d.leaseToken }); });
        await notificationRpc(e, { kind: "delivery.finish", id: d.id, leaseToken: d.leaseToken, ...result });
        if (result.status === "retry")
            message.retry({ delaySeconds: Math.min(3600, 30 * 2 ** d.attempt) });
        else
            message.ack();
        log.info("delivery_processed", { operation: "consume", eventId: job.eventId, channel: d.channel, outcome: result.status === "delivered" ? "success" : result.status === "retry" ? "retryable_failure" : "terminal_failure", errorCategory: result.code || "none" });
    }
    catch {
        log.warn("job_retry", { operation: "consume", eventId: job.eventId, queue: batch.queue, outcome: "retryable_failure", errorCategory: "processing_unavailable" });
        message.retry({ delaySeconds: Math.min(3600, 30 * 2 ** message.attempts) });
    }
} }
async function boundedBody(request: Request) { const reader = request.body?.getReader(); if (!reader)
    return ""; const chunks: Uint8Array[] = []; let size = 0; while (true) {
    const { done, value } = await reader.read();
    if (done)
        break;
    size += value.byteLength;
    if (size > 16000) {
        await reader.cancel();
        throw Error("body_too_large");
    }
    chunks.push(value);
} const bytes = new Uint8Array(size); let at = 0; for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.byteLength;
} return new TextDecoder().decode(bytes); }
export async function webhook(request: Request, e: NotificationEnv) { const url = new URL(request.url); if (url.pathname === "/health" && request.method === "GET")
    return Response.json({ service: "prepcraft-notifications", status: "ok" }); if (url.pathname !== "/webhooks/resend" || request.method !== "POST")
    return new Response("Not found", { status: 404 }); if (!e.RESEND_WEBHOOK_SECRET)
    return new Response("Not configured", { status: 503 }); if (Number(request.headers.get("content-length") || 0) > 16000)
    return new Response("Too large", { status: 413 }); let body: string; try {
    body = await boundedBody(request);
}
catch {
    return new Response("Too large", { status: 413 });
} if (!await verifyWebhook(body, request.headers, e.RESEND_WEBHOOK_SECRET))
    return new Response("Unauthorized", { status: 401 }); try {
    const event = JSON.parse(body) as {
        type?: string;
        data?: {
            email_id?: string;
        };
    };
    if (typeof event.type !== "string" || typeof event.data?.email_id !== "string" || event.data.email_id.length > 160)
        return new Response("Invalid event", { status: 400 });
    await notificationRpc(e, { kind: "provider.event", eventId: request.headers.get("svix-id"), eventType: event.type, providerId: event.data.email_id });
    return new Response("Accepted", { status: 200 });
}
catch {
    return new Response("Please retry", { status: 503 });
} }
const notificationWorker = { async scheduled(_controller: ScheduledController, e: NotificationEnv) { try {
        await dispatch(e);
    }
    catch {
        log.warn("dispatch_failed", { operation: "dispatch", outcome: "retryable_failure", errorCategory: "backend_unavailable" });
        throw Error("dispatch_failed");
    } }, queue: consume, fetch: webhook };
export default withSentry((e:NotificationEnv)=>workerMonitoring(e),notificationWorker);
