# PrepCraft — Production System Architecture
## Comprehensive System Overview & Architectural Contract

---

## 1. Product Context

**Product**: PrepCraft  
**Tagline**: *Craft your way to ready.*

PrepCraft is a software-engineering interview preparation operating system designed to guide candidates through a disciplined preparation loop:

```text
Plan
  ↓
Learn
  ↓
Practice
  ↓
Evaluate
  ↓
Revise
  ↓
Improve
  ↓
Prepare for Interview
  ↓
Track Applications
```

### Core Capabilities
- **Workspaces & Targets**: Multi-workspace candidate isolation, target companies, deadlines, compensation goals.
- **Daily & Weekly Planning**: Today view, dynamic plan rebalancing, weekly goals.
- **Practice & Library**: Curated canonical questions, company-specific collections, timers, Mistake Journal, Pattern Recognition Trainer.
- **Spaced Repetition & Mastery**: Evidence-based mastery calculation, retention intervals, automated revision queues.
- **CS Fundamentals & Languages**: Curated tracks for Java, SQL/DBMS, OS, Networks, System Design.
- **Real Interview Tracking**: Interview Day Mode, real phone screens, OAs, technical rounds, behavioral STAR stories, debrief reflections. *(PrepCraft contains NO AI mock interviews)*.
- **Applications & Pipeline**: Job application pipeline tracking, stage transitions, recruiter contacts, immutable resume versioning.
- **Analytics & Observability**: Evidence-derived progress metrics, structured telemetry, cross-system tracing.

---

## 2. Core Architectural Principles

1. **One Authoritative Relational Store**: **Supabase PostgreSQL** is the single authoritative system of record. There is no second database (no Cloudflare D1, no secondary PostgreSQL, no authoritative KV or Redis).
2. **Domain Services in the Application Layer**: Domain services express product behavior and reside in the Application Plane. They sit above infrastructure, not beneath it. Infrastructure (Supabase, Cloudflare, external providers) executes persistence, delivery, and storage.
3. **Decoupled Asynchronous Processing**: Synchronous user mutations commit their operational state to PostgreSQL immediately. Slow background work (analytics derivation, reminder fan-out, notification delivery) is decoupled onto Cloudflare Queues.
4. **Defense in Depth**: Access control is enforced across five progressive layers: UI capability hints → Server authorization → Domain service invariants → PostgreSQL constraints → Row Level Security (RLS).
5. **No Premature Infrastructure**: Scalability is achieved through strict boundaries and clean domain decoupling rather than architectural theater (no premature microservices, event sourcing, or Kafka).

---

## 3. High-Level System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT EXPERIENCE                               │
│                                                                             │
│  Browser / Responsive PWA (Desktop ≥1280px | Tablet 768–1279px | Mobile <768)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ HTTPS / WSS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             APPLICATION PLANE                               │
│                                                                             │
│                    Next.js App Router on Vercel                             │
│                                                                             │
│  ┌─────────────────────────┐             ┌───────────────────────────────┐  │
│  │    Server Components    │             │   Interactive Client Islands  │  │
│  │                         │             │                               │  │
│  │  • Initial page reads   │             │  • TanStack Query (Selective) │  │
│  │  • Workspace resolution │             │  • React Hook Form + Zod      │  │
│  │  • Metadata & SEO       │             │  • Practice Timers & Code Ed. │  │
│  │  • Secure data queries  │             │  • Motion & Visuals           │  │
│  └────────────┬────────────┘             └───────────────┬───────────────┘  │
│               │                                          │                  │
│               └────────────────────┬─────────────────────┘                  │
│                                    ▼                                        │
│                      ┌───────────────────────────┐                          │
│                      │   Application Operations  │                          │
│                      │                           │                          │
│                      │  • Server Actions         │                          │
│                      │  • Route Handlers         │                          │
│                      │  • Domain Services        │                          │
│                      │  • Zod Trust Boundaries   │                          │
│                      │  • Permission Assertions  │                          │
│                      └─────────────┬─────────────┘                          │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
                     ▼                               ▼
┌─────────────────────────────────────┐   ┌───────────────────────────────────┐
│       DATA & IDENTITY PLANE         │   │        ASYNC & EDGE PLANE         │
│                                     │   │                                   │
│  Supabase Auth                      │   │  Cloudflare Workers               │
│  PostgreSQL 15 (System of Record)   │   │  Cloudflare Queues                │
│  Row Level Security (RLS)           │   │  Cloudflare Cron Triggers         │
│  Relational Constraints & Triggers  │   │  Cloudflare R2 Object Storage     │
│  Selective Realtime Subscriptions   │   │  Selective KV Edge Cache          │
└──────────────────┬──────────────────┘   └─────────────────┬─────────────────┘
                   │                                        │
                   └──────────────────┬─────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            OBSERVABILITY PLANE                              │
│                                                                             │
│  • Sentry Error & Performance Tracing                                       │
│  • Structured Application Logs (sanitized, correlation-linked)              │
│  • Structured Cloudflare Worker Logs (no credential leakage)                │
│  • Append-Only PostgreSQL Activity Events                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. The Five Cooperating Planes

| Plane | Scope & Primary Responsibilities | Core Technologies |
|---|---|---|
| **1. Experience Plane** | User interaction, responsive layouts, forms, local UI state, interactive client caches, accessibility, charts | React 19, Next.js, Tailwind CSS, shadcn/ui, Hugeicons, Motion, TanStack Query, Recharts, D3 |
| **2. Application Plane** | Orchestration, business rules, domain state machines, server validation, permission checks, activity event dispatch | Next.js App Router, Server Actions, Route Handlers, Feature Domain Services, Zod |
| **3. Data & Identity Plane** | Authentication, user identity, session lifecycle, relational transactions, schema invariants, Row Level Security | Supabase Auth, PostgreSQL 15, PostgreSQL RLS, pgTAP |
| **4. Async & Edge Plane** | Background queues, at-least-once processing, scheduled cron triggers, private binary storage, selective edge cache | Cloudflare Workers, Cloudflare Queues, Cloudflare Cron, Cloudflare R2, Cloudflare KV |
| **5. Observability Plane** | Exception capture, latency tracing, structured sanitized logging, request/event correlation | Sentry, Structured JSON Loggers, PostgreSQL Activity Logs |

---

## 5. System Responsibility Matrix

| Responsibility | Authoritative Owner | Justification |
|---|---|---|
| **Identity & Sessions** | Supabase Auth | Secure session tokens, OAuth token refresh, user lifecycle |
| **User Profile & State** | Supabase PostgreSQL | Relational candidate profiles linked to auth identities |
| **Workspace Isolation** | Supabase PostgreSQL + RLS | Multi-tenant scoping via `workspace_members` |
| **Database Authorization** | PostgreSQL Row Level Security | Non-bypassable authorization at the query engine level |
| **Application Authorization** | Next.js Server Permissions | `permissions.ts` evaluates actor capability before operations |
| **Initial Page Render** | Next.js Server Components | Zero-bundle server rendering, secrets remain server-side |
| **Synchronous Mutations** | Server Actions / Route Handlers | Atomic request-response cycle coupled to UI state |
| **Business Domain Rules** | Feature Domain Services | Pure, testable calculations independent of web runtime |
| **Trust Boundary Validation** | Zod Schemas | Strict runtime validation on inputs, payloads, and env |
| **Interactive Client State** | TanStack Query | Client-side cache for filterable tables and pipeline boards |
| **Scheduled Orchestration** | Cloudflare Cron | Timezone-aware triggers invoking bounded queue fan-out |
| **Background Processing** | Cloudflare Queues + Workers | At-least-once asynchronous worker processing |
| **Large Object Storage** | Cloudflare R2 | Private binary storage for resumes, exports, and assets |
| **Object Metadata & Auth** | Supabase PostgreSQL | Ownership, permissions, MIME type, and size validation |
| **Edge Cache (Non-Authoritative)** | Cloudflare KV | Low-latency cache for static configs and topic catalogs |
| **Selective Live Updates** | Supabase Realtime | Notification alerts and multi-tab state sync |
| **Product Charts** | Recharts | Declarative SVG/Canvas charts for standard metrics |
| **Custom Visualizations** | D3.js | Specialized relationship graphs and knowledge maps |
| **Error Telemetry** | Sentry | Exception monitoring and distributed trace context |
| **Operational Telemetry** | Structured JSON Logs | Sanitized operational logs with correlation IDs |
| **Candidate Activity History**| PostgreSQL Activity Events | Append-only historical record of user accomplishments |

---

## 6. End-to-End Request Data Flows

### Flow A: Authentication & Workspace Resolution
```text
Browser
  ↓ 1. Clicks "Sign in with Google"
Supabase Auth (Redirects to Google OAuth)
  ↓ 2. Google authenticates candidate & redirects
Supabase Auth Callback (https://<ref>.supabase.co/auth/v1/callback)
  ↓ 3. Exchanges code for session JWT & sets secure cookies
Next.js Middleware (/src/lib/middleware.ts)
  ↓ 4. Refreshes session claims via updateSession()
Server Component (/app/w/[workspaceSlug]/page.tsx)
  ↓ 5. Resolves candidate profile & verifies workspace membership
PostgreSQL (SELECT FROM workspace_members WHERE user_id = auth.uid())
  ↓ 6. Confirms active member role
Render Authenticated Workspace Shell
```

---

### Flow B: Initial Workspace Page Load (Today Surface)
```text
Browser requests /w/prep-2026/today
  ↓
Next.js App Router (Server Component)
  ↓ Authenticate caller
Supabase Auth (Validate cookies, resolve auth.uid())
  ↓ Resolve workspace
Assert Workspace Membership (workspace_members query)
  ↓ Fetch parallel feature data (Server-side queries)
PostgreSQL Queries (Enforced by RLS):
  ├── Today's Study Plan (daily_plans query)
  ├── Due Revision Items (revisions query WHERE due_at <= NOW())
  ├── High-Priority Target Action (applications / interviews query)
  └── Recent Activity Digest (activity_events query)
  ↓
Compose HTML / RSC Payload (No client DB round-trips)
  ↓
Stream HTML Shell to Browser → Hydrate only interactive islands (Timers, Buttons)
```

---

### Flow C: Question Attempt Completion (Sync Mutation + Async Analytics)
```text
Browser (User clicks "Complete Practice Attempt")
  ↓
Server Action (completeAttemptAction in features/attempts/server/mutations.ts)
  ↓ 1. Authenticate caller (auth.uid())
  ↓ 2. Validate input against attemptSchema (Zod)
  ↓ 3. Authorize workspace membership (permissions.ts)
  ↓ 4. Execute Domain Service (attempt-evaluator.ts)
  ↓ 5. Atomic PostgreSQL Transaction:
        ├── INSERT INTO question_attempts (...)
        ├── UPDATE workspace_questions (status, last_practiced_at)
        ├── INSERT INTO mistakes (if mistakes reported)
        ├── Schedule Next Revision (revisions table)
        └── Append Activity Event (activity_events table)
  ↓ 6. Commit Transaction & Revalidate Cache (revalidatePath)
  ↓ 7. Enqueue Async Event (publish to 'analytics-events' queue)
Return Typed Result to Client (UI shows success immediately)
  │
  └── [Asynchronous Decoupled Path]
            ↓
      Cloudflare Queue ('prepcraft-prod-analytics-events')
            ↓
      Analytics Worker ('analytics-processor')
            ↓
      Validate Envelope & Deduplicate (eventId claim)
            ↓
      Compute Mastery Progress & Update Aggregates
```

---

### Flow D: Scheduled Revision Reminder (Cron Fan-Out)
```text
Cloudflare Cron Trigger (Fires hourly: 0 * * * *)
  ↓
Reminder Dispatcher Worker ('reminder-dispatcher')
  ↓ 1. Query PostgreSQL for due revision batches in candidate timezones
  ↓ 2. Partition into bounded messages (< 500 per batch)
  ↓ 3. Publish to Cloudflare Queue ('notifications')
Acknowledge Cron Trigger (< 3 seconds execution)
  │
  └── [Asynchronous Queue Processing]
            ↓
      Notification Consumer Worker
            ↓
      Deduplicate via Occurrence Key (reminder:revision:{userId}:{hour})
      Check if already sent → If not sent:
            ├── Create In-App Notification record (PostgreSQL)
            └── Dispatch Web Push / Email via external provider
```

---

### Flow E: Private File Download (Resume Version)
```text
Browser requests download (/api/files/[fileId]/download)
  ↓
Next.js Route Handler
  ↓ 1. Authenticate session via Supabase Auth
  ↓ 2. Query file metadata from PostgreSQL WHERE file_id = :fileId
  ↓ 3. PostgreSQL RLS verifies caller belongs to owning workspace
       ├── Unauthorized: Return HTTP 403 / 404
       └── Authorized: Retrieve object_key (e.g., uploads/ws_1/resume_v1.pdf)
  ↓ 4. Generate short-lived presigned R2 URL (TTL: 60 seconds)
Redirect browser to secure R2 stream (or stream bytes via Worker)
```

---

### Flow F: Code Execution Integration (Isolated Sandbox Boundary)
```text
Browser (Candidate clicks "Run Solution" in Code Editor)
  ↓
Next.js Server Action / Route Handler (/api/execution/run)
  ↓ 1. Authenticate caller & check rate limit (e.g. 10 runs / min)
  ↓ 2. Validate code payload, language (Java, Python), and input test cases
  ↓ 3. Dispatch to Isolated Execution Service (External Sandboxed Compute)
         • Dedicated container sandbox (gVisor / Firecracker)
         • Strict limits: 2s CPU, 256MB RAM, no network access, ephemeral FS
  ↓ 4. Execution Sandbox executes test cases & returns structured result
Next.js Server evaluates outputs → Returns execution verdict to Browser
```

---

### Flow G: Workspace Switching
```text
Browser (User selects different workspace from workspace switcher)
  ↓
Next.js Navigation to /w/[newWorkspaceSlug]/today
  ↓ 1. Server verifies active membership in newWorkspaceSlug
  ↓ 2. If unauthorized: Redirect to onboarding / 403
  ↓ 3. If authorized: Establish new workspace context
Client Shell receives new workspace context:
  ├── Invalidate all cached TanStack Query keys: queryClient.clear()
  ├── Purge previous workspace client-state
  └── Load fresh data scoped strictly to new workspaceId
```

---

## 7. Security Architecture & Trust Boundaries

```text
UNTRUSTED BOUNDARY
─────────────────────────────────────────────────────────────────
• Public Browser DOM & Client Storage
• Incoming HTTP Headers & Cookies
• URL Parameters (/w/[slug]/...) & Search Params
• User Code Submissions & File Uploads
• External Webhook Payloads & Provider Responses
• Queue Messages (must be verified at consumer entry)

VALIDATION & AUTHENTICATION BOUNDARY
─────────────────────────────────────────────────────────────────
• Zod Schemas (parse all runtime inputs)
• Supabase Auth JWT Verification
• HMAC Service Token Verification (Web Crypto)
• File MIME & Magic Number Verification

AUTHORIZATION BOUNDARY
─────────────────────────────────────────────────────────────────
• Server-Side Permission Assertions (server/permissions.ts)
• Active Workspace Membership Checks (workspace_members lookup)
• Supabase PostgreSQL Row Level Security (RLS engine enforcement)

DOMAIN BOUNDARY
─────────────────────────────────────────────────────────────────
• Pure Domain Services (src/features/<feature>/services/)
• Business Invariants & State Machine Rules

INFRASTRUCTURE BOUNDARY
─────────────────────────────────────────────────────────────────
• Supabase PostgreSQL Database Engine & Relational Constraints
• Cloudflare R2 Private Buckets
• Cloudflare Queues & Workers
• External Provider APIs (Sandboxes, Email, Web Push)
```

---

## 8. Failure Model & System Resilience

### Synchronous vs Asynchronous Failure Isolation
PrepCraft categorizes side-effects into **Critical** vs **Non-Critical**:

- **Critical Operations**: Persisting an attempt, updating revision schedules, recording workspace state. If these fail, the transaction rolls back, and the user receives an actionable error.
- **Non-Critical Operations**: Analytics derivation, email dispatch, daily review compilation. If these fail, the primary user transaction **must still succeed**. Non-critical tasks are retried asynchronously or sent to a dead-letter queue.

```text
Attempt Persisted in PostgreSQL (SUCCESS)
             │
             ├── Queue Publishing Fails (Transient Network Glitch)
             │   ↓
             │   PostgreSQL Transaction remains committed.
             │   Outbox entry / retry log allows background recovery.
             │
             └── User receives immediate success feedback.
```

### Eventual Consistency Boundaries
- **Strictly Consistent (Immediate)**: Attempt history, application pipeline stage, revision items, workspace membership. These MUST never be eventually consistent.
- **Eventually Consistent (Tolerant)**: Dashboard mastery charts, weekly study summary digests, aggregated workspace progress trends.

---

## 9. Performance & Responsive Model

PrepCraft is architected for instant responsiveness across device tiers:

| Device Tier | Viewport Width | Composition Strategy |
|---|---|---|
| **Desktop** | $\ge 1280\text{ px}$ | Full multi-column split panes, sticky navigation, advanced Recharts & D3 visualizations |
| **Tablet** | $768\text{ – }1279\text{ px}$ | Collapsible sidebar drawer, adapted dual-column flow, touch-optimized targets |
| **Mobile** | $< 768\text{ px}$ | Single-column linear flow, bottom navigation/drawer, lightweight data payloads |

### Mobile Payload Budget Rule
Heavy desktop visualizations and tabular datasets must not be downloaded by mobile clients and hidden with `display: none`. Server Components deliver streamlined data structures matching the viewport capability.

---

## 10. Architectural Decision Records (ADRs)

| ADR | Title | Decision Summary |
|---|---|---|
| [0001](../adr/0001-supabase-system-of-record.md) | Supabase is the System of Record | Supabase PostgreSQL is the sole relational store; D1 and Prisma are excluded. |
| [0002](../adr/0002-cloudflare-async-plane.md) | Cloudflare is the Async/Edge Plane | Cloudflare handles queues, cron, R2 storage, and edge workers. |
| [0003](../adr/0003-feature-oriented-frontend.md) | Server Components Default & Modular Frontend | Default to Server Components; TanStack Query used selectively for interactive state. |
| [0004](../adr/0004-idempotent-versioned-queue-consumers.md) | Idempotent Versioned Queue Consumers | Queue contracts are versioned; consumers claim atomic idempotency keys. |
| [0005](../adr/0005-r2-object-storage-metadata-ownership.md) | R2 Object Storage with PostgreSQL Metadata | R2 stores raw bytes; PostgreSQL owns file metadata, access control, and RLS. |
| [0006](../adr/0006-selective-realtime-subscriptions.md) | Selective Rather than Universal Realtime | Realtime subscriptions are restricted to high-value alerts, not every table. |
