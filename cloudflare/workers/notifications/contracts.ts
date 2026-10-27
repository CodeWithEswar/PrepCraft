import { z } from "zod";
import { createQueueEnvelopeSchema } from "../../shared/contracts/queue-envelope";
export const notificationJobSchema = createQueueEnvelopeSchema("notification.job", z.strictObject({ kind: z.enum(["delivery", "report"]), id: z.uuid() }));
export type NotificationJob = z.infer<typeof notificationJobSchema>;
export const outboxSchema = z.array(z.object({ id: z.uuid(), kind: z.enum(["delivery", "report"]), entityId: z.uuid(), workspaceId: z.uuid(), userId: z.uuid(), idempotencyKey: z.string().max(128), leaseToken: z.uuid(), createdAt: z.iso.datetime({ offset: true }) })).max(25);
export const deliverySchema = z.discriminatedUnion("state", [
    z.object({ state: z.literal("done") }), z.object({ state: z.literal("wait"), delay: z.number().min(1).max(43200) }),
    z.object({ state: z.literal("claimed"), id: z.uuid(), channel: z.enum(["email", "push"]), leaseToken: z.uuid(), attempt: z.number().int().min(1).max(6), idempotencyKey: z.string().max(128), email: z.email().nullable(), payload: z.object({ notificationId: z.uuid(), workspaceSlug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/), title: z.string().max(160), body: z.string().max(1200), actionType: z.string().max(80), sourceId: z.uuid().nullable(), reportId: z.uuid().nullable(), private: z.boolean(), expiresAt: z.iso.datetime({ offset: true }).nullable(), pushAccepted: z.array(z.uuid()).max(5).optional() }), subscriptions: z.array(z.object({ id: z.uuid(), endpoint: z.url().max(4096), keys: z.object({ p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}$/), auth: z.string().regex(/^[A-Za-z0-9_-]{22}$/) }) })).max(5).nullable() })
]);
export type ClaimedDelivery = Extract<z.infer<typeof deliverySchema>, {
    state: "claimed";
}>;
