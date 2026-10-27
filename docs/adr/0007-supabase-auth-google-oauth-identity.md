# ADR 0007: Supabase Auth & Google OAuth for Identity & Authentication

- **Status**: Accepted
- **Date**: 2026-10-24
- **Deciders**: Principal Authentication Architect, Staff Next.js Engineer, Application Security Engineer

---

## 1. Context

PrepCraft is a software-engineering interview preparation operating system. Candidates need a frictionless, secure, and reliable authentication experience to access their preparation plans, attempts, and workspaces across devices.

Key requirements:
1. One authoritative identity provider without maintaining raw credentials, salt rounds, or password reset infrastructure.
2. Production-grade session handling compatible with Next.js App Router (Server Components, Server Actions, Route Handlers, Edge Proxy).
3. Separation of Authentication ("Who is this candidate?") from Authorization ("Which workspaces can this candidate access?").
4. Returning-user convenience without exposing account enumeration vulnerabilities on shared devices.
5. Strict protection against Open Redirects, CSRF, and session leakage.

---

## 2. Decision

We adopt **Supabase Auth with Google OAuth 2.0** as PrepCraft's primary identity and authentication architecture:

1. **Authentication Plane**:
   - Google OAuth 2.0 provides external identity verification.
   - Supabase Auth orchestrates OAuth exchange (PKCE), session issuance, and token refresh.
   - Session state is persisted in encrypted, HTTP-only, `SameSite=Lax` cookies managed via `@supabase/ssr`.

2. **Server-Authoritative Post-Auth Resolver**:
   - The OAuth callback (`/auth/callback`) exchanges authorization codes securely on the server and invokes `resolvePostAuthDestination()`.
   - The resolver idempotently ensures a PostgreSQL `profiles` row exists, evaluates onboarding progress (`profile.onboarding_state`), and resolves verified active workspace memberships (`workspace_members`).
   - Unauthenticated candidates are routed to `/login`; incomplete onboarding resumes at the exact step; candidates with active workspaces are routed to their authorized workspace (`/w/[slug]/today`).

3. **Strict Separation of Authentication & Authorization**:
   - A valid Supabase JWT establishes identity only (`auth.uid()`).
   - It grants zero inherent access to any workspace until verified by the Next.js permission layer and PostgreSQL Row Level Security (RLS).

4. **Privacy-Conscious Local Device Hint**:
   - To provide a premium returning-device experience (`Welcome back · ch••••@gmail.com`), the browser persists a masked, non-authoritative hint strictly in local device storage (`localStorage`).
   - The application **never queries the server** with an unauthenticated email address, eliminating account enumeration risks.
   - A clear "Not you? Use another account" action allows candidates on shared devices to clear the hint and force Google account re-selection (`prompt: "select_account"`).

5. **Open Redirect Defense**:
   - Return paths (`returnTo`) are validated against a strict internal regex schema (`safeReturnPathSchema`).
   - Protocol-relative URLs (`//`), external schemes (`https:`), backslash bypasses (`/\`), directory traversals (`..`), and external hosts are stripped and safely defaulted to authorized destinations.

---

## 3. Alternatives Considered

1. **Email / Password Authentication**:
   - *Rejected*: Adds significant friction, password reset flows, credential stuffing vulnerabilities, and user management overhead without product benefit for modern developer users.
2. **NextAuth.js (Auth.js)**:
   - *Rejected*: Introduces a separate session state machine outside Supabase PostgreSQL, complicating database RLS policies which require native Supabase JWT claims (`auth.uid()`).
3. **Multi-Provider OAuth (GitHub, LinkedIn, Apple)**:
   - *Deferred*: Google OAuth satisfies 100% of candidate onboarding requirements for initial release. Adding multiple providers prematurely complicates the login surface.

---

## 4. Consequences & Invariants

- **Security**: Service-role keys (`SUPABASE_SERVICE_ROLE_KEY`) are forbidden in client code and restricted to server-side maintenance.
- **Resilience**: Even if a candidate's `last_active_workspace_id` is revoked or deleted, the resolver falls back gracefully to another active workspace or onboarding without breaking the session.
- **Cache Hygiene**: Logging out or switching accounts purges workspace-scoped client caches.
