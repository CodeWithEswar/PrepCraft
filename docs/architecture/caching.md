# PrepCraft — Caching & State Management Architecture
## Next.js Cache, TanStack Query & Selective Edge KV

This document defines the caching strategies, cache key taxonomies, and invalidation rules for PrepCraft across the application, client, and edge tiers.

---

## 1. The Six Mandatory Cache Questions

Before introducing any cache layer in PrepCraft, the design must provide explicit answers to six fundamental questions:

1. **What is the single authoritative source of truth?** *(Supabase PostgreSQL)*
2. **What is the exact cache key structure?** *(Must include tenant/workspace isolation dimensions)*
3. **How long can this data be stale?** *(Explicit TTL)*
4. **How and when is the cache invalidated?** *(Event-driven, revalidation tag, or mutation hook)*
5. **What happens on a cache miss?** *(Transparent read-through fallback to authoritative source)*
6. **Can stale data cause an authorization or security leak?** *(Cross-tenant data leakage risk assessment)*

If any of these six questions cannot be answered definitively, **the cache must not be implemented**.

---

## 2. Caching Hierarchy & Responsibilities

```text
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                            │
│                                                              │
│  TanStack Query (Interactive Server-State Cache)             │
│  • Filtered question tables                                  │
│  • Application pipeline board                                │
│  • Scoped by workspaceId                                     │
│  • Stale time: 60s | GC time: 5m                             │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ Next.js Dynamic Fetch
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION (VERCEL)              │
│                                                              │
│  Request Memoization (React cache())                         │
│  • Deduplicates duplicate queries within a single render pass│
│                                                              │
│  Next.js Data Cache (fetch with revalidate / tags)           │
│  • Public catalog & system templates                         │
│  • Invalidation: revalidateTag("workspace:{id}")             │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ Dynamic Query
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL                       │
│                                                              │
│  The Authoritative System of Record                          │
│  • Relational state, constraints, RLS                        │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ Async Sync
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE KV (SELECTIVE EDGE CACHE)      │
│                                                              │
│  Non-Authoritative Edge Cache:                               │
│  • Global public configuration & feature flags               │
│  • Static topic catalog metadata                             │
│  • Invalidation: Explicit purge on deployment                │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Next.js Server-Side Caching

Next.js provides multiple caching layers in the App Router:

### A. Request Memoization (`React.cache()`)
- Scope: Single HTTP request / server render pass.
- Used to deduplicate identical reads (e.g., resolving `getCurrentUser()` or `getActiveWorkspace()` across multiple nested Server Components in one page tree).
- Does not persist across separate requests or distinct users.

### B. Route Cache & Dynamic Rendering
- **User & Workspace Routes** (`/w/[slug]/...`): Always dynamically rendered per request (`export const dynamic = "force-dynamic"` or dynamic headers access).
- **Public Marketing Pages** (`/`, `/pricing`, `/terms`): Static with ISR or edge cached.
- **Rule**: Never cache authenticated, workspace-scoped pages statically without user isolation.

### C. Cache Invalidation via Tags
When a server mutation updates state, it invalidates cache tags deterministically:
```typescript
// Example mutation in server/mutations.ts
export async function completeRevisionAction(input: CompleteRevisionInput) {
  // ... authenticate, validate, authorize, persist ...

  // Invalidate specific cache tags
  revalidateTag(`workspace:${workspaceId}:revisions`)
  revalidatePath(`/w/${workspaceSlug}/revision`)

  return { ok: true, data: result }
}
```

---

## 4. TanStack Query (Interactive Client Server-State)

TanStack Query is used **selectively for interactive client islands** where client-side filtering, sorting, or pagination benefits UX.

### Query Key Taxonomy
All TanStack Query keys must incorporate tenant boundaries to prevent cross-workspace data bleed:

```typescript
// Standard Query Key Structure: [entity, workspaceId, parameters]
const questionKeys = {
  all: (workspaceId: string) => ["questions", workspaceId] as const,
  list: (workspaceId: string, filters: QuestionFilters) =>
    ["questions", workspaceId, filters] as const,
  detail: (workspaceId: string, questionId: string) =>
    ["questions", workspaceId, questionId] as const,
}

const applicationKeys = {
  all: (workspaceId: string) => ["applications", workspaceId] as const,
  board: (workspaceId: string) => ["applications", workspaceId, "board"] as const,
}
```

### Global Configuration
Defined in [src/providers/query-provider.tsx](file:///d:/PrepCraft/src/providers/query-provider.tsx):
- `staleTime: 60 * 1000` (1 minute): Prevents aggressive refetching during interactive tab navigation.
- `gcTime: 5 * 60 * 1000` (5 minutes): Inactive cache garbage collection.
- `refetchOnWindowFocus: false`: Disables unexpected network bursts when switching browser tabs.
- `refetchOnReconnect: "always"`: Refetches stale data after network reconnection.

### Workspace Switching Rule
When a candidate switches workspaces, **all existing client query caches must be purged**:
```typescript
queryClient.removeQueries({ queryKey: ["questions", previousWorkspaceId] })
queryClient.clear()
```
This guarantees that candidate records from Workspace A never flash or render within Workspace B.

---

## 5. Cloudflare KV — Selective Non-Authoritative Edge Cache

Cloudflare KV provides globally distributed, low-latency key-value storage with eventual consistency.

### Permitted Uses of KV
- Non-critical global configuration (e.g. system maintenance banners).
- Public canonical problem catalog metadata (e.g., list of DSA patterns, CS topic slugs).
- Edge routing hints.

### Strictly Forbidden in KV
KV has eventual consistency and must **NEVER** store:
- User identities or passwords.
- Workspace membership or roles.
- Question solve attempts or mistake logs.
- Spaced repetition revision schedules.
- Job application stages or interview notes.
- Readiness scores or mastery percentages.
- Row Level Security authorization state.

Any state where an eventual-consistency read could grant unauthorized access or display corrupted candidate history belongs exclusively in **Supabase PostgreSQL**.
