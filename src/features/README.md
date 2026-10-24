# PrepCraft — Feature Architecture & Engineering Contract

Every business capability in PrepCraft is encapsulated within its own feature module under `src/features/<feature>/`.
This directory structure represents an **engineering contract**, not a mechanical folder template.

---

## 1. Feature Module Contract

```text
src/features/<feature>/
│
├── components/           # Feature-specific UI presentation and interaction
│   ├── <entity>-list.tsx
│   ├── <entity>-detail.tsx
│   └── <entity>-filters.tsx
│
├── server/               # Server-only infrastructure operations (requires import "server-only")
│   ├── queries.ts        # Authenticated, scoped database reads (no SELECT *, paginated)
│   ├── mutations.ts      # Authorized, validated state transitions
│   └── permissions.ts    # Server-authoritative capability and access checks
│
├── services/             # Pure, portable domain business logic and calculations
│   ├── <entity>-service.ts
│   └── <entity>-calculator.ts
│
├── schemas/              # Zod validation schemas for trust boundaries
│   ├── <entity>.schema.ts
│   └── <entity>-filter.schema.ts
│
├── hooks/                # Feature-specific React hooks (client-only, created when needed)
│   └── use-<feature>-filters.ts
│
├── types/                # Feature-specific TypeScript interfaces and types
│   └── <feature>.types.ts
│
├── utils/                # Presentation formatting helpers (domain logic belongs in services/)
│   └── <feature>.utils.ts
│
├── tests/                # Unit tests for domain services, calculations, and schemas
│   ├── <entity>-service.test.ts
│   └── <entity>-calculator.test.ts
│
└── index.ts              # Curated public module API
```

### On-Demand Rule
Directories and files are created **only when real implementation requires them**.
- If a feature does not need client hooks, do NOT create an empty `hooks/`.
- If a feature has no presentation formatters, do NOT create an empty `utils/`.
- `utils/` is a warning sign: ask "Is this business logic?" If yes, it belongs in `services/`.

---

## 2. Core Boundary: `server/` vs `services/`

The distinction between `server/` and `services/` is strict:

- **`server/` (Infrastructure-Facing)**:
  - Must include `import "server-only"`.
  - Interfaces directly with Supabase clients, cookies, headers, and Next.js server runtime.
  - Resolves authentication sessions and verifies workspace membership.
  - Implements `queries.ts`, `mutations.ts`, and `permissions.ts`.
  - Never imported by Client Components.

- **`services/` (Pure Business & Domain Rules)**:
  - Framework-agnostic pure TypeScript.
  - Implements business calculations (revision scheduling, mastery formulas, readiness evaluation, application stage transition state machines).
  - Portable across Next.js Server Actions, Route Handlers, Cloudflare Workers, and Unit Tests.
  - Separates calculation from orchestration.

---

## 3. Standard Mutation Flow

Every state-changing mutation in `server/mutations.ts` follows this sequence:

```text
REQUEST
   ↓
AUTHENTICATE (resolve active session)
   ↓
VALIDATE (Zod schema in schemas/)
   ↓
AUTHORIZE (permissions.ts + workspace membership)
   ↓
EXECUTE DOMAIN RULE (call domain service in services/)
   ↓
PERSIST (atomic Supabase PostgreSQL operation)
   ↓
EMIT ACTIVITY / EVENT (Cloudflare Queue event if applicable)
   ↓
CACHE INVALIDATION (revalidatePath / revalidateTag)
   ↓
TYPED RESULT
```

---

## 4. Defense-in-Depth Model

Authorization is enforced across five progressive layers:
```text
Client capability hint (UX display)
        ↓
Server authorization (server/permissions.ts)
        ↓
Domain business constraints (services/)
        ↓
PostgreSQL schema constraints (NOT NULL, CHECK, UNIQUE, FOREIGN KEY)
        ↓
Supabase PostgreSQL Row Level Security (RLS)
```

The client is never a security boundary.

---

## 5. Domain Ownership & Boundaries

Keep domains strictly decoupled:
- `questions/`: Canonical question catalog.
- `attempts/`: Candidate practice attempts & code execution logs.
- `revision/`: Spaced repetition scheduling & due queue.
- `mastery/`: Evidence-based mastery calculation.
- `readiness/`: Target company readiness benchmark evaluation.
- `interviews/`: Real interview rounds, OAs, and debriefs. (No AI mock interviews).
- `applications/`: Job search pipeline stages and recruiter history.
- `planning/`: Daily study plan generation & goal tracking.

### Cross-Feature Communication Rule
- External consumers import ONLY from `src/features/<feature>/index.ts` (or `server/index.ts` for server callers).
- Deep internal imports into another feature's private modules are prohibited.
- Circular dependencies (`A → B → A`) are strictly rejected.

See [Feature Boundaries Architecture Document](../../docs/architecture/feature-boundaries.md) for full architectural specifications.
