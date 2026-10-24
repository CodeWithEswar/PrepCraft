# System overview

## Purpose and ownership

PrepCraft is one modular Next.js application. Routes compose features; features own product behavior; shared components render reusable presentation; `lib` supplies technical infrastructure. Supabase PostgreSQL will own authoritative relational state. Cloudflare is reserved for justified asynchronous, edge and object-storage workloads.

The implemented product today is the marketing preview. There are no authenticated workspaces, product tables or deployed workers. Phase 03 establishes enforceable boundaries without implementing those later phases.

## Layers and data flow

```text
Next routes / layouts
    → feature UI and server orchestration
    → validation, authorization and pure domain rules
    → request-scoped Supabase client → PostgreSQL constraints + RLS
                                          ↓ future transactional outbox
                                   validated queue envelope
                                          ↓
                              Cloudflare consumer → derived work / R2
```

A server mutation authenticates, validates untrusted input, resolves workspace membership, checks feature permission, applies a domain rule, persists, records an activity/outbox event, and invalidates relevant cached data. A queue is not an alternate database or an authorization boundary.

## Dependency rules

- `app → features → components/lib/providers/hooks/types` is the normal direction.
- Shared modules cannot import routes or features. Features cannot import routes.
- Cross-feature callers use deliberate `index.ts` or `server/index.ts` entry points. Never combine server and browser runtime exports in one barrel.
- Runtime imports reachable from `use client` cannot reach server-only modules. Type-only edges are permitted but still participate in cycle checks.
- Only `src/lib/env` reads application environment variables. `NODE_ENV` is the deliberate framework compile-time exception.
- Cloudflare contracts remain portable and cannot import the Next application.

`npm run architecture:check` checks TypeScript import/export/require/literal dynamic-import edges, cycles and these boundaries. Next's `server-only` marker provides a second build-time check. Computed imports and other language/runtime mechanisms still need review; this checker is not a sandbox.

## Failure modes and testing

Missing Supabase settings fail before client creation, rather than connecting to a placeholder project. Public marketing can build without database credentials. Domain failures use typed operation results; unexpected exceptions are logged with safe correlation context and translated into friendly UI errors. Schema changes must carry isolation tests. Workers will require retry/idempotency tests before their first deployment.

See [ADRs](../adr/README.md), [refactor map](refactor-map.md), and the phase validation report.
