# Security — Object Storage & R2 Access Architecture

## Purpose
Governs the storage, retrieval, and access control of candidate-uploaded binary files (resumes, exported journals, problem attachments) using Cloudflare R2.

## Architectural Boundaries
1. **Metadata in PostgreSQL**: File names, MIME types, byte sizes, upload timestamps, owning `workspace_id`, and `user_id` are stored in authoritative PostgreSQL tables.
2. **Objects in Private R2 Buckets**: Raw binary files reside in private Cloudflare R2 buckets. No bucket has public read or listing permissions enabled.
3. **Presigned URLs with Strict TTL**:
   - Downloads: Signed URLs expire after 5 minutes (300 seconds).
   - Uploads: Presigned PUT URLs expire after 10 minutes and enforce Content-Length limits and expected MIME types.
4. **Server-Side Authorization**: Before issuing any presigned URL, the API verifies that the requesting user has valid read or write access to the associated workspace in PostgreSQL.

## Data Isolation
Object keys follow a structured tenant prefix:
```text
workspaces/{workspace_id}/resumes/{file_id}.pdf
workspaces/{workspace_id}/exports/{export_id}.zip
```
Even if an object key were guessed, the absence of public access prevents unauthorized retrieval without a valid HMAC signature.
