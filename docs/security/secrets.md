# Security — Secrets Management Policy

## Purpose
Prevents leakage of sensitive credentials, API keys, database connection strings, and service role tokens across development, CI, and production environments.

## Variable Classification
All configuration keys in `.env.example` fall into strictly segregated tiers:

| Tier | Prefix / Variable | Visibility | Safe for Client Bundle? |
| --- | --- | --- | --- |
| **Public Browser** | `NEXT_PUBLIC_*` | Browser runtime | **YES** (Only non-sensitive tokens like public Supabase anon key) |
| **Server-Only** | `SUPABASE_SERVICE_ROLE_KEY` | Node.js Server runtime only | **NO — NEVER EXPOSE** |
| **Cloudflare Secrets** | `CLOUDFLARE_API_TOKEN`, `R2_SECRET_ACCESS_KEY` | Cloudflare runtime only | **NO — NEVER EXPOSE** |
| **Database Direct** | `DATABASE_URL`, `POSTGRES_PASSWORD` | CI & Migration runners | **NO — NEVER EXPOSE** |

## Enforcement & Guardrails
1. **Zod Environment Validation**: `src/lib/env/server.ts` validates server-only keys and strictly prevents them from being bundled into client code.
2. **Git Hygiene**: `.gitignore` unconditionally ignores `.env`, `.env.local`, `.env.*.local`, `.dev.vars`, and `wrangler.toml` secret overrides.
3. **Automated Secret Scanning**: The GitHub security workflow (`.github/workflows/security-checks.yml`) scans commits for high-entropy tokens and private keys.
4. **Local Development**: Developers use `.env.local` containing local Supabase CLI secrets, never sharing production tokens.
