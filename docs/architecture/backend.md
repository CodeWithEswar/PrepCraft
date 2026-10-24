# Application Plane Architecture — Backend, Server Actions & Domain Services

The Application Plane is the orchestration and business decision engine of PrepCraft. It lives within the Next.js App Router running on Vercel and coordinates domain logic, validation, permissions, transactional persistence, and asynchronous event publishing.

---

## 1. Architectural Position: Services Above Infrastructure

PrepCraft strictly places **Domain Services above Infrastructure**:

```text
Next.js Server Operation (Server Action / Route Handler)
         ↓
Domain Service (src/features/<feature>/services/)
  • Pure business rules
  • State transitions & interval calculations
  • Decoupled from HTTP, cookies, and database drivers
         ↓
Infrastructure Adapters
  ├── Supabase PostgreSQL (Persistence, Constraints, RLS)
  ├── Cloudflare Queues (Asynchronous event publishing)
  ├── Cloudflare R2 (Binary object storage)
  └── External Providers (Code execution sandbox, email)
```

Domain services express product behavior. Infrastructure executes persistence, scheduling, and storage.

---

## 2. Server Operations: Server Actions vs Route Handlers

PrepCraft distinguishes clearly between Server Actions and Route Handlers:

| Dimension | Server Actions | Route Handlers |
|---|---|---|
| **Primary Use** | UI-driven mutations tightly coupled to Next.js components | Machine-to-machine HTTP endpoints, webhooks, callbacks, file streaming |
| **Location** | `src/features/<feature>/server/mutations.ts` | `src/app/api/.../route.ts` |
| **Return Type** | `Promise<OperationResult<T>>` (typed discriminated union) | `NextResponse` (JSON, Stream, Redirect) |
| **Invocation** | Direct function call from client forms, buttons, or hooks | Standard HTTP `GET`, `POST`, `PUT`, `DELETE` requests |
| **Cache Effect** | Direct `revalidatePath()` / `revalidateTag()` | Cache control headers |

### Anti-Pattern: HTTP For Everything
Do not turn internal application operations into internal HTTP Route Handlers that Next.js Server Components call via `fetch()`. Call domain services directly inside Server Actions and Server Components.

---

## 3. The Canonical Mutation Sequence

Every material state-changing mutation in `server/mutations.ts` must execute this exact nine-step sequence:

```text
1. REQUEST
   ↓ Caller initiates mutation with input payload
2. AUTHENTICATE
   ↓ Verify session via Supabase Auth (resolve auth.uid()); reject anonymous callers
3. VALIDATE
   ↓ Parse input against feature Zod schema; reject malformed payloads
4. AUTHORIZE
   ↓ Assert workspace membership and capability via permissions.ts
5. EXECUTE DOMAIN RULE
   ↓ Call pure domain service in services/ (e.g., attempt-evaluator, revision-scheduler)
6. PERSIST (Atomic Transaction)
   ↓ Execute single PostgreSQL transaction under caller's database role
7. EMIT ACTIVITY / EVENT
   ↓ Record append-only activity event; publish async event to Cloudflare Queue if needed
8. CACHE INVALIDATION
   ↓ Revalidate relevant cache paths (revalidatePath) and tags (revalidateTag)
9. TYPED RESULT
   ↓ Return deterministic OperationResult<T>
```

---

## 4. Server-Side Transaction Principle

Multi-entity updates that must succeed or fail together must execute within a single **atomic PostgreSQL transaction**:

### Example: Attempt Completion
When a candidate completes a question attempt, four entities require atomic updates:
1. `question_attempts`: Insert execution record (time, language, status, code snapshot).
2. `workspace_questions`: Update solve count, last practiced date, and status.
3. `revisions`: Schedule or update the next spaced repetition interval.
4. `activity_events`: Append an immutable user activity event.

**Rule**: Never perform multiple unrelated client-side mutations hoping all succeed. All related updates are executed atomically on the server. If any part fails, the entire transaction rolls back cleanly.

---

## 5. Domain Services Contract (`src/features/<feature>/services/`)

Domain services own business calculations:
- `revision-scheduler.ts`: Computes next review intervals based on candidate confidence ratings.
- `mastery-calculator.ts`: Computes mastery percentages based on solve frequency, retention, and time decay.
- `readiness-evaluator.ts`: Assesses candidate readiness against target company benchmarks.
- `application-transition.ts`: Enforces valid hiring pipeline state machine transitions.

### Purity & Portability
- Domain services are **pure TypeScript functions**.
- They accept data as arguments and return typed results.
- They do **NOT** import `server-only`, `next/headers`, `next/server`, or database client instances directly.
- This allows domain services to be tested with 100% test isolation and reused inside Cloudflare Workers or background jobs without code duplication.

---

## 6. Error Architecture & Classification

All server operations return a standardized, serializable `OperationResult<T>`:

```typescript
export type OperationErrorCode =
  | "validation"       // Input failed Zod schema checks
  | "unauthenticated"  // Missing or expired user session
  | "forbidden"        // User lacks membership or permission for resource
  | "not_found"        // Requested entity does not exist in workspace
  | "conflict"         // State conflict (e.g. concurrent mutation, unique constraint)
  | "rate_limited"     // Operation exceeds rate limit
  | "unavailable"      // Downstream dependency or database temporarily offline
  | "unexpected"       // Unhandled internal exception

export type OperationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: OperationErrorCode; message: string; correlationId: string; fieldErrors?: Record<string, string[]> } }
```

### Security Rule: No Internal Leaks
- Raw SQL query text, database column names, internal stack traces, and cloud provider error messages are **NEVER returned to the client**.
- Exceptions are logged server-side with their `correlationId`, while clients receive safe, friendly human-authored error messages.

---

## 7. Isolated Code Execution Sandbox Boundary

Code execution for DSA practice represents an untrusted computing boundary:
- User-submitted code (Java, Python) must **NEVER execute inside the Next.js server, Supabase, or Cloudflare Workers**.
- Code execution is dispatched to a dedicated, isolated execution sandbox service.
- The execution sandbox enforces:
  - Strict 2-second CPU timeout.
  - 256 MiB memory ceiling.
  - Ephemeral container filesystem discarded after execution.
  - Network access completely disabled.
  - Output stdout/stderr capped at 64 KiB.
