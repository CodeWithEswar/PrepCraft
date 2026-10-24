# Security — Incident Response Protocol

## Purpose
Establishes clear procedures for reporting, triaging, containing, and remediating security incidents, data breaches, or compromised credentials.

## Severity Classification
- **P0 — Critical**: Active data breach, cross-workspace data leakage, compromised Supabase service-role secret, or production database intrusion.
- **P1 — High**: Exposed OAuth client secret, unvalidated redirect vulnerability, or RLS policy failure affecting a subset of tenant rows.
- **P2 — Medium**: Stored XSS vulnerability in user notes, improper rate-limiting on unauthenticated endpoints.
- **P3 — Low**: Misconfigured HTTP security header, verbose error message leaking non-sensitive stack trace in development.

## Response Steps
1. **Identification**: Incident logged via Sentry, Cloudflare audit logs, or direct report.
2. **Containment**:
   - Compromised Key: Rotate the affected token immediately in Supabase / Cloudflare dashboard.
   - Broken RLS: Deploy emergency migration revoking table grants or disabling affected policy.
   - Malicious Session: Invalidate active user tokens via `supabase.auth.admin.signOut(userId)`.
3. **Remediation**: Develop and test fix in isolated branch with regression tests.
4. **Post-Mortem**: Document root cause, timeline, affected tenant scope, and permanent automated guardrails.
