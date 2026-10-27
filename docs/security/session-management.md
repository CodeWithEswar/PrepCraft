# Security Guide: Session Management & Access Lifecycle

This document defines session cookie lifetimes, token refresh mechanics, revocation handling, and client state isolation.

---

## 1. Session Storage & Cookie Security

PrepCraft uses `@supabase/ssr` to persist candidate sessions strictly in HTTP-only cookies:

- `HttpOnly`: Inaccessible to client JavaScript, mitigating Cross-Site Scripting (XSS) session theft.
- `Secure`: Transmitted strictly over HTTPS in production.
- `SameSite=Lax`: Mitigates Cross-Site Request Forgery (CSRF) on mutation operations.
- `Path=/`: Scoped to the entire PrepCraft domain.

---

## 2. Session Refresh via Next.js Proxy

The Next.js 16 proxy ([src/proxy.ts](file:///d:/PrepCraft/src/proxy.ts)) intercepts requests to:
1. Refresh expiring Supabase Auth session tokens via `supabase.auth.getUser()`.
2. Apply refreshed cookie values to both request and response objects.
3. Emit cache-protection headers (`Cache-Control: private, no-store`, `Pragma: no-cache`) to ensure authenticated responses are never cached by intermediate proxies or CDNs.

---

## 3. Session Expiration & Re-Authentication

When a candidate's session expires:
1. The protected action or route catches the unauthenticated condition.
2. The user's intended destination is captured via `returnTo`.
3. The candidate is redirected to `/login?reason=session_expired&returnTo=...`.
4. The login page displays a dedicated "Session expired" banner.
5. Upon re-authenticating with Google, the post-auth resolver verifies authorization for the target route and resumes the candidate's session without data loss.

---

## 4. Workspace Access Revocation

When a candidate's membership in a workspace is revoked:
1. The Supabase identity session remains valid (the user is still authenticated).
2. The server permission asserter (`requireWorkspace()`) detects `status !== 'active'`.
3. The server redirects the user to `/login?reason=access_revoked&workspace=[slug]`.
4. The client clears any workspace-scoped TanStack Query cache to prevent stale data display.
5. The candidate is presented with options to access their other active workspaces or initiate onboarding for a new workspace.

---

## 5. Logout & Cache Hygiene

Executing `signOutAction()`:
1. Calls `supabase.auth.signOut()` on the server to invalidate the session tokens.
2. Next.js clears the session cookies.
3. The browser purges workspace-scoped cache state.
4. The user is redirected to `/login`.
