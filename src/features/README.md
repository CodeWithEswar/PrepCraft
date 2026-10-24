# PrepCraft — Feature Architecture Contract

Every business capability in PrepCraft should be encapsulated within its own feature module under `src/features/<feature-name>/`.

## Module Blueprint

```text
src/features/<feature>/
├── components/           # Feature-specific UI components
├── server/               # Server-only database queries and mutations
│   ├── queries.ts        # Data fetching functions (Server Components / Actions)
│   ├── mutations.ts      # Data mutations (Server Actions)
│   └── permissions.ts    # Server-side authorization & policy assertions
├── hooks/                # Feature-specific React hooks
├── schemas/              # Zod validation schemas
├── services/             # Pure business logic and domain calculations
├── types/                # Domain-specific TypeScript types & interfaces
├── utils/                # Feature-specific pure utility functions
└── index.ts              # Clean public module boundary
```

## Rules & Principles

1. **Selective Structure**: Do not force every feature to contain every folder. Only create folders and files when the feature actually needs them.
2. **Encapsulation**: External callers use deliberate `src/features/<feature>/index.ts` or `server/index.ts` APIs. Never mix server and browser runtime exports in one barrel. Server entry points import `server-only`.
3. **Server-First**: Database operations belong in `server/queries.ts` or `server/mutations.ts`. Never perform direct database calls from Client Components.
4. **Validation**: All user inputs must be parsed against Zod schemas in `schemas/`.
5. **No Universal Junk Drawers**: Keep feature-specific logic within its domain. Promote to `src/components/` or `src/lib/` only after reusable patterns emerge across multiple features.

Only marketing is implemented now. See [domain ownership](../../docs/features/domain-map.md) for planned capabilities and delivery order. In particular, real interview/OA tracking belongs to `interviews`, never `mocks`. The architecture checker enforces import direction, public feature entries, cycles and transitive client/server separation.
