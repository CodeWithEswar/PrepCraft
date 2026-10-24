# Backend, authentication and authorization

## Current boundary

`src/lib/supabase/client.ts` is the browser client; `server.ts` is request-scoped server infrastructure; `session.ts` is a dormant request-session helper. The Supabase barrel exports types only. No proxy, OAuth callback, login UI, profile creation or protected route is activated in this phase.

The installed SSR API uses `getAll`/`setAll`. The session helper preserves supplied cache-protection headers when refreshed cookies are written. Authentication implementation must wire and test refresh at the request boundary before using the Server Component client. Read-only Server Components cannot persist refreshed cookies themselves. Do not cache responses containing user-specific cookies or private data. Server Actions/Route Handlers must coordinate response headers and session refresh, not rely on the current dormant helper as an access gate.

## Query and mutation ownership

Feature reads belong in `features/<name>/server/queries.ts`; mutations/actions belong alongside them. Route Handlers handle HTTP framing and call feature services. Pure domain rules live in feature `services`; do not put database queries in global `lib/database.ts` or route components.

Every sensitive operation must:

1. Verify the session using the Supabase-supported server verification flow; do not trust the user object from `getSession` alone.
2. Parse input with a feature Zod schema, rejecting unexpected fields where appropriate.
3. Resolve slug → workspace → active membership → capability server-side.
4. Apply the domain rule and write under the caller's database identity so RLS remains active.
5. Commit related state/history atomically, emit durable events through an outbox where required, then update caches scoped by workspace/user.
6. Return `OperationResult<T>` for expected failures; preserve a safe correlation ID for unexpected/infrastructure failures.

`validation`, `unauthenticated`, `forbidden`, `not_found`, `conflict`, `rate_limited`, `unavailable`, and `unexpected` are distinct internal outcomes. Friendly messages are intentionally authored, never copied from raw database/SDK exceptions. HTTP handlers map these to appropriate status codes; Server Actions return the discriminated union.

## Authentication phase gate

The next phase owns Google OAuth, redirect allowlists, callback validation, sessions, profiles, onboarding/workspace resolution and protected layouts. Implement permission helpers only when actual membership schema exists. A service-role client must never become the default query client. See [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client) and [security boundaries](../security/threat-model.md).
