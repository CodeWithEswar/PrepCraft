# Feature Architecture: Authentication & Identity

## 1. Purpose & Product Context
The Authentication & Identity feature provides a secure, streamlined Google OAuth 2.0 flow for PrepCraft candidates. It resolves authenticated identity, idempotently bootstraps candidate profiles, verifies onboarding completion, asserts active workspace membership, and directs users to authorized destinations without dashboard flashing or account enumeration.

---

## 2. Module Ownership & Directory Tree

```text
src/features/auth/
├── components/
│   ├── login-form.tsx            # Interactive mineral-glass card island
│   ├── google-auth-button.tsx    # Official Google provider action with pending states
│   ├── remembered-account.tsx    # Local-device convenience hint with privacy masking
│   ├── auth-resolving.tsx        # Branded workspace preparation state
│   ├── auth-error.tsx            # Inline error alert with retry capabilities
│   ├── session-expired.tsx       # Session timeout feedback banner
│   ├── access-revoked.tsx        # Workspace membership revocation feedback
│   └── auth-header.tsx           # Restrained header with logo, theme toggle & home link
│
├── server/
│   ├── index.ts                  # Public server entry point (requires server-only)
│   ├── actions.ts                # signOutAction server action
│   ├── queries.ts                # PostgreSQL queries for profile & workspaces
│   ├── resolver.ts               # Server post-auth resolution orchestration
│   └── permissions.ts            # requireUser, requireWorkspace assertions
│
├── services/
│   ├── post-auth-resolver.ts     # Pure domain decision tree
│   ├── safe-return-path.ts       # Open redirect validation and path sanitization
│   └── profile-bootstrap.ts      # Profile extraction from OAuth metadata
│
├── schemas/
│   └── auth.schema.ts            # Zod validation schemas
│
├── types/
│   └── auth.types.ts             # Auth state machine & profile interfaces
│
├── utils/
│   └── remembered-account.ts     # LocalStorage hint reader/writer with referential cache
│
└── index.ts                      # Feature public contract
```

---

## 3. Authentication State Machine

The authentication flow is governed by an explicit state machine:

| State | Context / Description | User Experience |
|---|---|---|
| `SIGNED_OUT` | Unauthenticated visitor | Marketing landing page or `/login` surface |
| `OAUTH_STARTING` | Initiated Google sign-in | Button in pending state ("Connecting securely…") |
| `OAUTH_CALLBACK_PENDING` | Server handling `/auth/callback` | Branded loader ("Preparing your workspace…") |
| `AUTHENTICATED_PROFILE_RESOLVING` | Post-auth resolver verifying profile & membership | No dashboard flash; resolver runs server-side |
| `AUTHENTICATED_ONBOARDING_REQUIRED` | Incomplete onboarding state (`profile.onboarding_state`) | Resumes exact step (`/onboarding/[step]`) |
| `AUTHENTICATED_WORKSPACE_REQUIRED` | No active workspace memberships found | Directed to `/onboarding/workspace` |
| `AUTHENTICATED_READY` | Active workspace resolved | Directed to `/w/[slug]/today` (or safe `returnTo`) |
| `SESSION_EXPIRED` | Expired Supabase session cookie | Banner: "Your session has expired. Sign in again." |
| `ACCESS_REVOKED` | User active, but membership in target workspace revoked | Banner: "Workspace access changed. Sign in to choose an authorized workspace." |
| `AUTH_ERROR` | Provider or network failure | Inline alert with safe explanation and "Try again" action |

---

## 4. Returning User Recognition (Local Device Convenience)

To provide a refined returning-user experience (`Welcome back · ch••••@gmail.com`), PrepCraft implements a **zero-trust local hint pattern**:

1. **Local-Only Storage**: The candidate's email and display name are cached in `localStorage` strictly upon verified authentication.
2. **Account Enumeration Prevention**: The application **never queries the server** with an unauthenticated email address.
3. **Privacy Masking**: Displayed emails are masked by default (`ch••••••••••@gmail.com`).
4. **"Not You?" Action**: Shared device users can click "Not you?" to clear the local hint and force Google's account selection prompt (`prompt: "select_account"`).

---

## 5. Open Redirect Protection

All candidate return destinations (`returnTo`) pass through `sanitizeReturnPath()`:
- Rejects protocol-relative URLs (`//evil.example`).
- Rejects external schemes (`https:`, `http:`, `javascript:`, `data:`).
- Rejects backslash bypasses (`/\evil.com`, `\evil.com`).
- Rejects directory traversals (`..`, `../`).
- Restricts targets strictly to approved application prefixes (`/w/`, `/onboarding`, `/settings`, `/profile`).

---

## 6. Edge Protection & Next.js Proxy

The Next.js 16 proxy ([src/proxy.ts](file:///d:/PrepCraft/src/proxy.ts)) intercepts requests to:
1. Refresh expiring Supabase Auth session tokens via `@supabase/ssr`.
2. Attach cache-protection headers (`private, no-store`).
3. Intercept unauthorized requests to `/w/[slug]/*` and `/onboarding/*`, redirecting to `/login?reason=unauthenticated&returnTo=...`.
4. Leave public marketing, login, and static asset routes unblocked.
