# Cloudflare Workers — Architectural Contract

Each independently deployable Worker in PrepCraft has a strict single responsibility boundary, explicit typed bindings, and independent runtime lifecycle.

---

## 1. Planned Worker Boundaries

| Worker Name | Responsibility | Triggers & Bindings | Downstream System |
| --- | --- | --- | --- |
| `reminder-dispatcher` | Identifies due revision sessions & study plans; enqueues reminder messages | Cloudflare Cron Trigger, PostgreSQL read | Cloudflare Queue (`notifications`) |
| `analytics-processor` | Derives workspace activity aggregates & mastery trends from events | Cloudflare Queue (`analytics-events`) | Supabase PostgreSQL / Cache |
| `import-worker` | Executes batch processing of external question catalogs or CSV imports | Cloudflare Queue (`imports`), R2 Bucket | Supabase PostgreSQL |
| `file-service` | Streams private attachments and coordinates presigned URLs | HTTP Fetch, R2 Bucket (`prepcraft-files`) | R2 Storage (after Supabase auth) |

Workers are created on-demand as concrete implementation requires them. Do not create placeholder empty workers.

---

## 2. Worker Internal Contract

When a Worker is created, it must follow this internal layout:

```text
cloudflare/workers/<worker-name>/
├── src/
│   ├── index.ts        # Entry point (fetch / queue / scheduled export)
│   ├── handler.ts      # Request/Event routing and orchestration
│   ├── bindings.ts     # TypeScript interface defining typed Env & bindings
│   └── services/       # Worker-local domain operations or adapters
├── tests/              # Vitest / Miniflare worker unit & integration tests
└── wrangler.toml       # Worker configuration and resource bindings
```

---

## 3. Bindings Contract

Every Worker must define its environment interface explicitly in `src/bindings.ts`:

```typescript
export interface Env {
  // Environment variables
  ENVIRONMENT: "development" | "staging" | "production"
  SUPABASE_URL: string

  // Secrets (injected via Cloudflare Secret Store / .dev.vars)
  SUPABASE_SERVICE_ROLE_KEY: string
  INTERNAL_SERVICE_SECRET: string

  // Resource bindings
  ANALYTICS_QUEUE?: Queue<unknown>
  NOTIFICATIONS_QUEUE?: Queue<unknown>
  FILES_BUCKET?: R2Bucket
  CONFIG_KV?: KVNamespace
}
```

Never rely on untyped `env` access or global node assumptions.

---

## 4. Operational Invariants

1. **No Application Database in Workers**: Cloudflare Workers interact with Supabase PostgreSQL as the authoritative store. Workers do not establish alternate databases.
2. **Runtime Portability**: Worker code imports shared contracts from `cloudflare/shared/`. Worker code must never import Next.js modules (`next/headers`, `next/server`) or `src/app/` code.
3. **Structured Sanitized Logging**: Every Worker uses `WorkerLogger` from `cloudflare/shared/observability/structured-logger.ts` to log structured events without leaking credentials or headers.
4. **Bounded Execution**: Worker requests and queue batches must be bounded. Heavy operations must paginate or enqueue follow-up work.
