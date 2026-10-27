# 0070 — Keep platform services bounded

Status: accepted for the current platform implementation.

Next.js, Supabase and the existing Cloudflare account cover the current workload. Add neither D1 business truth nor Redis without a measured need.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
