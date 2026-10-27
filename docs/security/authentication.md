# Security Guide: Authentication & Identity

This document defines the security controls, boundary defenses, and invariants governing candidate authentication in PrepCraft.

---

## 1. Trust Boundaries

```text
UNTRUSTED
────────────────────────────────────────────────────────────────
Browser Window · LocalStorage · URL Query (returnTo) · OAuth Code
────────────────────────────────────────────────────────────────
                               ↓
VALIDATION LAYER
────────────────────────────────────────────────────────────────
Zod Schemas (safeReturnPathSchema, rememberedAccountHintSchema)
Supabase OAuth PKCE Exchange
────────────────────────────────────────────────────────────────
                               ↓
AUTHENTICATION PLANE
────────────────────────────────────────────────────────────────
Supabase Auth · Cryptographic JWT · HTTP-Only SameSite Cookies
────────────────────────────────────────────────────────────────
                               ↓
AUTHORIZATION PLANE
────────────────────────────────────────────────────────────────
Server Permission Asserters (requireUser, requireWorkspace)
PostgreSQL Row Level Security (RLS) on public.profiles & public.workspaces
────────────────────────────────────────────────────────────────
```

---

## 2. Open Redirect Defense

Open redirect vulnerabilities allow attackers to construct links that abuse a trusted application domain to funnel candidates to phishing infrastructure.

### Defense Rules
1. **Never pass unvalidated query parameters to `redirect()` or `NextResponse.redirect()`**.
2. **Use `sanitizeReturnPath(candidate, fallback)`**:
   - Asserts string starts with `/`.
   - Disallows double slashes (`//`) and backslash variations (`/\`, `\`).
   - Disallows URI schemes (`[a-zA-Z]+:`).
   - Disallows directory traversal (`/../`, `/..`).
   - Restricts destinations strictly to allow-listed application prefixes (`/w/`, `/onboarding`, `/settings`, `/profile`).
3. If validation fails, safely fallback to the authorized workspace default (`/w/[slug]/today`) or root.

---

## 3. Account Enumeration Prevention

An application must never leak whether an email address exists in the system to unauthenticated visitors.

### Invariants
1. **Zero Unauthenticated User Lookups**: There is no public API or route that takes an email address and checks for account existence.
2. **Local Convenience Only**: The "Last used on this device" hint is stored strictly in the visitor's browser `localStorage`.
3. **Privacy Masking**: The local hint is masked (`ch••••••••••@gmail.com`) so casual onlookers cannot read complete candidate emails.
4. **Shared Device Safety**: Clear action removes the local hint immediately without hitting network endpoints.

---

## 4. Credential & Key Safety

1. **Publishable Key Only**: Frontend code only receives `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy anon key with `role: "anon"`).
2. **Service Role Forbidden on Client**: `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS and is strictly forbidden from client bundles and `NEXT_PUBLIC_*` environment variables.
3. **No OAuth Secrets in Frontend**: Google Client Secret resides securely in the Supabase backend configuration.
