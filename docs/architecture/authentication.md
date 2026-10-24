# Architecture — Authentication & Session Management

## Purpose
Establishes user identity, secures HTTP sessions, handles OAuth callbacks, and supplies authenticated user context to the application layer.

## Technology Choice
- **Supabase Auth (`@supabase/ssr`)**: Authoritative authentication engine utilizing secure, HTTP-only, `SameSite=Lax` cookies.
- **Next.js Middleware**: Edge route protection and token refresh.
- **Server Components & Server Actions**: Direct authenticated client instantiation via `@/lib/supabase/server`.

## Flow Overview
```text
Browser                       Next.js Server                   Supabase Auth
   │                                 │                               │
   ├─────── 1. Login with Google ───►│                               │
   │                                 ├────── 2. Redirect to OAuth ──►│
   │◄────── 3. OAuth Consent Screen ─┼───────────────────────────────┤
   │                                 │                               │
   ├─────── 4. Code Callback ───────►│                               │
   │        /auth/callback           ├────── 5. Exchange Code ──────►│
   │                                 │◄───── 6. Session & JWT ───────┤
   │◄────── 7. Set HTTP-Only Cookie ─┤                               │
   │        Redirect /w/[slug]/today │                               │
```

## Security Invariants
1. **Never use Service Role on Client**: The `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to browser bundles.
2. **Never Trust Client-Reported User IDs**: All server actions and queries derive the active `userId` from the verified session JWT (`auth.getUser()`), never from client parameters.
3. **Cookie Hygiene**: Authentication tokens are stored exclusively in HTTP-only cookies managed via `@supabase/ssr`.
4. **Session Verification**: Route handlers and Server Components verify auth before performing workspace lookup.
