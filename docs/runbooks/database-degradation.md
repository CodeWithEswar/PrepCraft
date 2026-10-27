# Database degradation

Check Supabase health, connection counts, slow queries and recent migrations. Distinguish authentication/authorization failures from dependency timeouts; never retry a permission failure as a transient outage.

Pause optional external dispatch if needed. Core writes must fail visibly without fake success. Preserve request IDs and drafts. Use bounded source retries; review EXPLAIN before adding indexes. Restore only through the selected plan’s documented procedure and a rehearsed drill.
