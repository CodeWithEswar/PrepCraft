# PrepCraft — Feature Architecture & Engineering Contract

This document defines the authoritative architectural contracts, folder structures, domain boundaries, security models, and dependency rules for all feature engineering in PrepCraft.

---

## 1. Core Engineering Principle

PrepCraft strictly follows a layered, unidirectional dependency flow:

### Synchronous User Operations

```text
Next.js Route (src/app/)
        ↓
Feature UI Component (src/features/<feature>/components/)
        ↓
Application / Domain Service (src/features/<feature>/services/)
        ↓
Server Query / Mutation (src/features/<feature>/server/)
        ↓
Authorization + Zod Validation (permissions.ts + schemas/)
        ↓
Supabase PostgreSQL (Database Constraints + Row Level Security)
```

### Asynchronous & Background Operations

```text
Domain Event / Scheduled Cron Trigger
              ↓
      Cloudflare Worker
              ↓
        Cloudflare Queue
              ↓
       Validated Consumer (cloudflare/shared/validation/)
              ↓
       Domain Operation (portable domain service)
              ↓
     Supabase PostgreSQL / Cloudflare R2 / Provider
```

These boundaries exist to ensure predictable ownership, security enforcement, testability, and zero architectural drift.

---

## 2. Feature Folder Contract

Every substantial product capability lives in its own domain module under:

```text
src/features/<feature>/
```

### Standard Feature Layout

```text
src/features/<feature>/
│
├── components/           # Feature-specific UI presentation and client interaction
│   ├── <entity>-list.tsx
│   ├── <entity>-detail.tsx
│   └── <entity>-filter-bar.tsx
│
├── server/               # Infrastructure-facing server operations (server-only)
│   ├── queries.ts        # Authenticated, scoped database reads
│   ├── mutations.ts      # Validated, authorized state changes
│   └── permissions.ts    # Authoritative server-side permission assertions
│
├── services/             # Pure, portable domain business logic and calculations
│   ├── <entity>-service.ts
│   └── <entity>-calculator.ts
│
├── schemas/              # Zod validation schemas for all trust boundaries
│   ├── <entity>.schema.ts
│   └── <entity>-filter.schema.ts
│
├── hooks/                # Feature-specific React hooks (optional, client-only)
│   └── use-<feature>-filters.ts
│
├── types/                # Domain-specific TypeScript interfaces and types
│   └── <feature>.types.ts
│
├── utils/                # Presentation formatting (non-domain helpers only)
│   └── <feature>.utils.ts
│
├── tests/                # Unit & integration tests for domain services and schemas
│   ├── <entity>-service.test.ts
│   └── <entity>-calculator.test.ts
│
└── index.ts              # Public module boundary (curated exports)
```

### On-Demand Principle
This layout is a **contract, not a directory generator**.
- If a feature has no client hooks, do not create an empty `hooks/`.
- If it has no presentation formatting helpers, do not create `utils/`.
- Directories and files are created only when genuine implementation requires them.

---

## 3. Strict Boundary: `server/` vs `services/`

The distinction between `server/` and `services/` is the core architectural foundation of PrepCraft:

| Dimension | `src/features/<feature>/server/` | `src/features/<feature>/services/` |
| --- | --- | --- |
| **Responsibility** | Infrastructure-facing server operations | Business rules, calculations, and domain state machines |
| **Runtime Boundary** | `import "server-only"` mandatory | Framework-agnostic, pure TypeScript |
| **Database Access** | Direct Supabase client queries & mutations | No direct database connection; accepts data as input |
| **Session & Auth** | Resolves auth session & workspace membership | Agnostic to caller identity; processes domain arguments |
| **Environment** | Server Components, Server Actions, Route Handlers | Next.js Server Actions, Route Handlers, Cloudflare Workers, Unit Tests |
| **Testability** | Requires mocked database/Supabase client | 100% pure unit testable with standard inputs and outputs |

### Pure Domain Logic Rule
Calculations should be pure whenever practical:
```text
input data → domain service calculation → deterministic result
```
Instead of:
```text
domain service → reads cookies → queries DB → calls external API → calculates
```
Separate **calculation** from **orchestration**.

---

## 4. Feature Ownership & Domain Boundaries

Each domain owns its specific concepts without overlapping responsibilities:

- `questions/`: Canonical question catalog, metadata, difficulty tiers, pattern tags.
- `attempts/`: Candidate practice attempts, execution time, code history, mistake records.
- `revision/`: Spaced repetition scheduling, intervals, due forecasts, queue rebalancing.
- `mastery/`: Evidence-based mastery calculation based on solve intervals, decay, and consistency.
- `readiness/`: Target company readiness criteria and benchmark evaluation.
- `interviews/`: Real interview rounds, phone screens, OAs, question encounters, debriefs. (PrepCraft does not build AI mock interviews).
- `applications/`: Job application tracker, recruitment pipeline stages, recruiter notes.
- `planning/`: Daily study plan generation, week goals, calendar scheduling.

---

## 5. Components Contract & Shared Component Rule

### Feature Components (`src/features/<feature>/components/`)
- Presentation and client interaction only.
- May consume the feature's public hooks, types, or Server Action bindings.
- Must NEVER execute direct database calls, SQL queries, or bypass authorization.

### Shared Components (`src/components/`)
A component moves into `src/components/` **only when it is genuinely application-wide or reused across multiple unrelated features**:
- `src/components/ui/` (primitives: Button, Dialog, Drawer, Input, Tabs)
- `src/components/data-table/` (generic table pagination, sorting)
- `src/components/charts/` (generic chart containers)
- `src/components/feedback/` (empty states, spinners, error alerts)

**Anti-Pattern:** Premature universal abstractions (`UniversalCard`, `UniversalManager`, `UniversalEntityDialog`). Prefer domain-specific components until a genuine reusable pattern emerges.

---

## 6. Server Infrastructure Contract (`server/`)

### `server/queries.ts`
- Performs read-only operations.
- Authenticates caller and resolves active workspace.
- Enforces read permissions.
- Selects only required columns (avoid `SELECT *`).
- Implements intentional pagination (keyset/cursor for high-volume datasets).
- Returns typed results.

### `server/mutations.ts`
Every state-changing mutation must follow the canonical sequence:
```text
1. REQUEST
2. AUTHENTICATE (verify active session)
3. VALIDATE (parse input against Zod schema)
4. AUTHORIZE (verify workspace membership & role capability)
5. EXECUTE DOMAIN RULE (call domain service for transitions/calculations)
6. PERSIST (execute atomic PostgreSQL update/insert)
7. EMIT ACTIVITY / EVENT (publish queue event if applicable)
8. CACHE INVALIDATION (revalidatePath / revalidateTag)
9. TYPED RESULT (return deterministic success/error payload)
```

### `server/permissions.ts`
Feature-specific authorization checks belong here (e.g. `canViewQuestion()`, `canTransitionApplication()`).
Defense-in-depth model:
```text
Client UX capability hint
        ↓
Server Action authorization assertion
        ↓
Domain service business constraint validation
        ↓
PostgreSQL schema constraints (CHECK, FK, UNIQUE, NOT NULL)
        ↓
Supabase PostgreSQL Row Level Security (RLS)
```

---

## 7. Schemas Contract (`schemas/`)

All trust boundaries are validated at runtime using Zod:
- Server Action inputs.
- Route Handler request bodies and query parameters.
- Cloudflare Queue envelopes and message payloads.
- External webhook payloads.
- File and CSV import records.

TypeScript interfaces are compile-time types; Zod schemas enforce runtime integrity.

---

## 8. Public Feature Entry Point (`index.ts`)

Every feature exposes an intentional public API via `src/features/<feature>/index.ts`:
```typescript
// Good: curated public interface
export { QuestionList } from "./components/question-list"
export { QuestionDetail } from "./components/question-detail"
export type { QuestionSummary, QuestionDifficulty } from "./types/question.types"
```

**Forbidden in `index.ts`:**
- Private database helpers.
- Internal authorization logic.
- Test fixtures.
- Mixing client and server-only code in one export barrel.

### Cross-Feature Dependencies & Circular References
- Feature A may consume Feature B only via Feature B's public `index.ts`.
- Deep internal imports (`@/features/B/server/internal/...`) are prohibited.
- Circular dependencies (`questions → attempts → questions`) are strictly forbidden. Coordinate multi-feature workflows via orchestration services or domain events.

---

## 9. Quality Gates

Before any feature code is merged, verify:

```text
[ ] Feature boundaries: Feature code lives under src/features/<feature>/
[ ] Separation of concerns: UI components contain zero direct database logic
[ ] Server isolation: server/ modules import "server-only"
[ ] Domain portability: services/ modules contain pure business logic
[ ] Validation: All mutation inputs are parsed via Zod schemas
[ ] Authorization: Server checks permissions; PostgreSQL enforces RLS
[ ] Intentional public API: index.ts exports only curated public symbols
[ ] No circular dependencies: imports form a directed acyclic graph (DAG)
[ ] Tests: Domain services have automated unit test coverage
[ ] Architecture CI passes: npm run architecture:check exits 0
```
