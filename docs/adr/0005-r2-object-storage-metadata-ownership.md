# 0005: Cloudflare R2 for object storage with PostgreSQL metadata ownership

**Status:** Accepted, 24 October 2026.

**Context:** PrepCraft requires storage for candidate resume versions, preparation exports, study notes attachments, and generated reports. Storing large binary objects directly inside PostgreSQL causes database bloat, expensive backups, and poor streaming performance. Conversely, relying on object storage keys directly for authorization exposes files to access bypasses and lacks tenant isolation.

**Decision:**
1. Use **Cloudflare R2** strictly for binary byte storage.
2. Maintain all authoritative file metadata, ownership, MIME types, byte sizes, checksums, and tenant isolation strictly in **Supabase PostgreSQL**.
3. Enforce PostgreSQL Row Level Security (RLS) on file metadata queries. A user possessing an R2 object key has zero inherent access; downloads require prior server-side authorization.
4. Enforce resume version immutability: once a resume is associated with a job application, its underlying R2 object is never overwritten; modifications produce a new version (`resume_v2`).

**Alternatives Considered:**
- Storing binary blobs directly in PostgreSQL (`bytea`): Rejected due to database bloat and backup overhead.
- Using Supabase Storage: Valid alternative, but Cloudflare R2 provides zero egress fees and tighter integration with the Cloudflare Workers asynchronous plane.
- Public S3/R2 bucket with public URLs: Rejected due to severe privacy risks for personal resumes and candidate career notes.

**Consequences:**
- Uploads and downloads require an extra metadata handshake with PostgreSQL before issuing presigned URLs or streaming bytes.
- Direct bucket listing is disabled.
- Candidate resumes and attachments enjoy enterprise-grade privacy and auditability.
