import type { AnalyticsSnapshot } from "@/features/analytics";
export const categories = ["plan", "revision", "practice", "interview", "application", "report", "workspace", "system", "custom"] as const;
export type Category = typeof categories[number];
export type InboxView = "all" | "unread" | "saved" | "archive" | "snoozed";
export interface Workspace {
    id: string;
    slug: string;
    name: string;
    timezone: string;
    userId?: string;
    canEdit?: boolean;
}
export interface NotificationItem {
    id: string;
    workspace: Workspace;
    category: Category;
    eventType: string;
    title: string;
    body: string;
    reason: string;
    context: {
        count?: number;
        estimateMinutes?: number;
        anchorAt?: string;
    };
    sourceType: string;
    sourceId: string | null;
    actionType: string;
    priority: "normal" | "important";
    state: "pending" | "available" | "read" | "archived";
    scheduledFor: string;
    availableAt: string;
    readAt: string | null;
    savedAt: string | null;
    archivedAt: string | null;
    resolvedAt: string | null;
    resolutionCode: string | null;
    snoozedUntil: string | null;
    createdAt: string;
    reportId: string | null;
}
export interface InboxFilters {
    view: InboxView;
    category: Category | "all";
    workspace: string;
    range: "7d" | "30d" | "90d" | "all";
    search: string;
}
export interface InboxPage {
    context: {
        workspace: Workspace;
        asOf: string;
        policyVersion: string;
    };
    items: NotificationItem[];
    counts: Record<InboxView, number> & {
        bounded: boolean;
        limit: number;
    };
    cursor: {
        at: string;
        id: string;
    } | null;
    attention: {
        items: number;
        revisionItems: number;
    };
}
export interface Schedule {
    scheduleType: "once" | "daily" | "weekly" | "selected_days" | "event_relative";
    timezone: string;
    localTime?: string | null;
    daysOfWeek?: number[] | null;
    localDate?: string | null;
    absoluteAt?: string | null;
    anchorAt?: string | null;
    offsetMinutes?: number | null;
}
export interface Reminder {
    id: string;
    type: "custom" | "daily_plan" | "revision_due" | "weekly_target" | "weekly_report" | "upcoming_session" | "target_deadline";
    title: string;
    body: string;
    sourceType: "workspace" | "task" | "target" | "custom";
    sourceId: string | null;
    priority: "normal" | "important";
    channels: ("in_app" | "email" | "push")[];
    enabled: boolean;
    respectQuietHours: boolean;
    version: number;
    archivedAt: string | null;
    schedule: Schedule;
    nextRunAt: string | null;
    lastRunAt: string | null;
}
export interface Preferences {
    inApp: boolean;
    email: boolean;
    push: boolean;
    quietEnabled: boolean;
    quietStart: string;
    quietEnd: string;
    timezone: string;
    pushPrivacy: "private" | "detailed";
}
export interface Report {
    id: string;
    periodStart: string;
    periodEnd: string;
    timezone: string;
    status: "pending" | "generating" | "ready" | "failed";
    generatedAt: string | null;
    failureCode: string | null;
    attemptCount: number;
    snapshot?: ReportSnapshot | null;
}
export interface ReportSnapshot {
    version: 1;
    policyVersion: string;
    analyticsPolicyVersion: string;
    periodStart: string;
    periodEnd: string;
    timezone: string;
    generatedAt: string;
    workspace: Workspace;
    context: AnalyticsSnapshot["context"];
    filters: AnalyticsSnapshot["filters"];
    core: AnalyticsSnapshot["core"];
    activity: AnalyticsSnapshot["activity"];
    interviews: AnalyticsSnapshot["interviews"];
    masteryEvidence: unknown;
    coverage: Record<string, "available" | "unavailable">;
}
export interface NotificationSettings {
    workspace: Workspace;
    reminders: Reminder[];
    preferences: (Preferences & {
        id: string;
        scope: "account" | "workspace";
        family: string;
    })[];
    effective: Preferences;
    devices: {
        id: string;
        provider: string;
        name: string;
        createdAt: string;
        lastUsedAt: string | null;
        revokedAt: string | null;
    }[];
    workspaces: Workspace[];
    relatedTasks: {
        id: string;
        title: string;
        at: string;
        type: string;
    }[];
    targetAvailable: boolean;
    reports: Report[];
    capabilities: {
        inApp: boolean;
        background: boolean;
        email: boolean;
        push: boolean;
        pushPublicKey: string | null;
        interviewTracking: boolean;
        applications: boolean;
    };
}
export interface NotificationDetail {
    id: string;
    currentSource: {
        valid: boolean;
        code?: string;
    };
    deliveries: {
        channel: string;
        status: string;
        providerStatus: string | null;
        scheduledFor: string;
        deliveredAt: string | null;
        failureCode: string | null;
    }[];
    report: {
        id: string;
        status: string;
        snapshot: ReportSnapshot | null;
    } | null;
}
export interface NotificationBootstrap {
    inbox: InboxPage;
    settings: NotificationSettings;
    preview: boolean;
    error?: string;
}
