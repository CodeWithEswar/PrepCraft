# Behavioral release verification

All 358 unit/component tests across 46 files pass. The production build, TypeScript, scoped lint and dependency architecture checks pass. The new migration is applied on the linked Supabase project; all 19 local/remote entries align. Live read-only checks verify ten RLS-enforced tables, no anonymous/client writes, seeded frameworks and shared evidence guards without reading user story bodies. No personal stories were seeded.

The ephemeral PostgreSQL fixture passes 65 checks. Six production-browser tests pass sequentially with a 120-second test budget; the initial six-worker run exceeded the SQL lab's 30-second test budget during disposable database startup. This was an environment/contention timeout, and the isolated rerun passes. The 18-state audit reports zero accessibility violations/client errors across both themes; overflow checks cover ten viewport widths. Learn's five full labels and glass scrollbar pass nine widths, and the user's open Learn tab was refreshed and visually verified.

Supabase advisors report no Behavioral-specific warnings. The 22 pre-existing workspace/bootstrap, account protection and permissive-policy warnings remain documented in behavioral-advisors.json. Existing security settings were not changed. Full Docker integration and large-scale load benchmarks were not run.

Screenshots, query plans, detailed commands and machine-readable evidence are in this directory. The preview is http://localhost:3031/preview/behavioral.
