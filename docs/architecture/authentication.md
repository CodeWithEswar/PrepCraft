# Authentication Architecture — Supabase Auth, Google OAuth & Session Management

This document defines user identity, session management, OAuth callback resolution, and the boundary between authentication and authorization in PrepCraft.

---

## 1. Authentication vs Authorization

PrepCraft maintains a strict conceptual and operational boundary between Authentication and Authorization:

```text
AUTHENTICATION (Supabase Auth)
  Question: "Who is this user?"
  • Verifies candidate credentials via Google OAuth
  • Issues cryptographically signed session JWTs
  • Manages session refresh, token expiration, and logout
  • Output: Verified auth.uid() and user metadata
               ↓
AUTHORIZATION (Next.js Permissions + PostgreSQL RLS)
  Question: "Can this user access this workspace or perform this action?"
  • Resolves workspaceSlug → workspace_id
  • Verifies active membership in workspace_members for auth.uid()
  • Evaluates role capabilities (Owner vs Member)
  • Enforces Row Level Security (RLS) on all PostgreSQL queries
```

**Rule**: An authenticated user with a valid JWT has **zero inherent access to any workspace** until workspace membership is verified.

---

## 2. Authentication Flow & Session Lifecycle

```text
Browser                       Next.js App                      Supabase Auth
   │                               │                               │
   ├────── 1. Click "Sign in" ────►│                               │
   │                               ├──── 2. Redirect to OAuth ────►│
   │◄───── 3. Google Consent Screen┼───────────────────────────────┤
   │                               │                               │
   ├────── 4. Auth Code Callback ─►│                               │
   │       /auth/callback          ├──── 5. Exchange Code ────────►│
   │                               │◄─── 6. Issue Session JWT ─────┤
   │                               │                               │
   │                               ├──── 7. Resolve Candidate ────►│ (PostgreSQL)
   │                               │    • Profile exists?          │
   │                               │    • Onboarding completed?    │
   │                               │    • Workspace resolved?      │
   │                               │                               │
   │◄───── 8. Set HTTP-Only Cookie ┤                               │
   │       Redirect to /w/[slug]   │                               │
```

---

## 3. Session Refresh via Next.js Middleware

Next.js Middleware ([src/lib/middleware.ts](file:///d:/PrepCraft/src/lib/middleware.ts)) intercepts incoming requests to refresh expiring Supabase session tokens:

- Uses `createServerClient` from `@supabase/ssr`.
- Extracts cookies via `request.cookies.getAll()`.
- Refreshes tokens and sets response cookies via `supabaseResponse.cookies.setAll()`.
- Calls `await supabase.auth.getClaims()` to validate the active session without premature logout bugs.
- If the token is refreshed, new HTTP-only cookies are attached to the `NextResponse` so client and server sessions remain synchronized.

---

## 4. Onboarding & Workspace Resolver Gate

After OAuth exchange, the candidate enters the Resolver Pipeline:

```text
Authenticated Session (auth.uid())
             ↓
Check profiles WHERE id = auth.uid()
   ├── Profile Missing → Redirect to /onboarding/profile
   └── Profile Exists
            ↓
       Check workspace_members WHERE user_id = auth.uid()
          ├── No Active Workspaces → Redirect to /onboarding/workspace
          └── Active Workspaces Exist
                   ↓
              Redirect to /w/[defaultWorkspaceSlug]/today
```

---

## 5. Security Invariants

1. **Service-Role Key Forbidden on Client**: `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security. It is strictly reserved for administrative scripts and backend jobs; it is never included in client bundles.
2. **Never Trust Client-Supplied User IDs**: All Server Actions and Route Handlers extract `userId` strictly from the verified session JWT (`auth.getUser()`). Client-supplied `userId` parameters are ignored.
3. **HTTP-Only, Secure Cookies**: Authentication tokens reside strictly in encrypted, HTTP-only, `SameSite=Lax` cookies. JavaScript running in the browser cannot read raw session tokens.
4. **Session Verification Before Querying**: Server Components instantiate the server Supabase client via [src/lib/supabase/server.ts](file:///d:/PrepCraft/src/lib/supabase/server.ts), ensuring every database read runs with the caller's verified PostgreSQL role and `auth.uid()`.
