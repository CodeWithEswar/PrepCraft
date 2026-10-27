# No D1 or second Analytics truth

Status: Accepted · 2026-10-26

Analytics stores no attempt, schedule, Mastery, Readiness or hiring score. Existing domain tables remain authoritative. This phase introduces read functions and supporting source indexes only; there is no D1 copy, warehouse or Cloudflare aggregation pipeline.

Unavailable sources stay explicit. Future materialization requires a measured need, ownership/freshness design and a separate migration/decision record.
