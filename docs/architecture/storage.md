# PrepCraft — Object Storage Architecture
## Cloudflare R2, PostgreSQL Metadata Ownership & File Lifecycle

This document defines the object storage architecture for PrepCraft.
PrepCraft uses **Cloudflare R2** for binary object storage and **Supabase PostgreSQL** for authoritative file metadata and access control.

---

## 1. Core Architectural Principle

Binary objects and authoritative authorization reside in strictly separate layers:

```text
┌──────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL                       │
│                                                              │
│  Authoritative File Metadata & Row Level Security:           │
│  • file_id (UUID primary key)                                │
│  • workspace_id (tenant boundary)                            │
│  • owner_id (user who uploaded the asset)                    │
│  • object_key (opaque storage identifier in R2)              │
│  • original_name (safe sanitized filename)                   │
│  • mime_type (verified content type)                         │
│  • byte_size (content length)                                │
│  • sha256_checksum (integrity fingerprint)                   │
│  • created_at, updated_at                                    │
└──────────────────────────────┬───────────────────────────────┘
                               │
               Metadata & RLS  │ Controlled Access
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE R2                           │
│                                                              │
│  Private Binary Byte Storage:                                │
│  • Resumes (immutable versions)                              │
│  • Export archives (CSV/JSON preparation digests)            │
│  • User attachments (problem notes, diagrams)                │
└──────────────────────────────────────────────────────────────┘
```

### Invariant Rules
1. **R2 Keys Do NOT Prove Authorization**: A user possessing an R2 object key or URL path has zero inherent permission to read or mutate the file. All access must be authorized by PostgreSQL before reading or streaming bytes.
2. **No Public Buckets**: All PrepCraft buckets are strictly private. Direct public bucket listing or open HTTP access is disabled.
3. **Immutability of Application Assets**: Once a file (such as a resume version) is linked to a job application or interview submission, the underlying R2 object is permanently immutable.

---

## 2. File Ingestion & Upload Flow

File uploads follow a multi-stage validation and authorization sequence:

```text
Browser (User selects PDF resume)
   ↓
1. Request Upload URL (Server Action: requestResumeUpload)
   ↓
2. Authenticate & Authorize Workspace
   - Verify active session (auth.uid())
   - Check active workspace membership
   ↓
3. Validate Request Metadata
   - Verify mime_type (e.g. application/pdf)
   - Verify declared byte_size <= 10 MiB limit
   - Generate unique opaque object_key:
     uploads/{workspaceId}/{fileId}/{sha256}.pdf
   ↓
4. Create Pending Metadata Record in PostgreSQL
   - Status: "pending_upload"
   ↓
5. Issue Controlled Presigned Upload URL
   - Short-lived signed URL (valid for 15 minutes)
   - Bound to exact object_key and Content-Type
   ↓
6. Direct Upload from Browser to R2
   - Uploads bytes directly to R2 via presigned PUT
   ↓
7. Confirm Upload Completion (Server Action: confirmResumeUpload)
   - Verify byte_size and checksum against R2 head object
   - Update PostgreSQL status: "ready"
```

---

## 3. Private File Download Flow

Downloading private candidate files requires server authorization:

```text
Browser (Candidate requests resume download)
   ↓
Next.js Route Handler (/api/files/[fileId]/download)
   ↓
1. Authenticate Request
   - Extract user session via Supabase Auth
   ↓
2. Authorize via PostgreSQL Query with RLS
   - Select file metadata WHERE file_id = :fileId
   - RLS asserts caller belongs to owning workspace_id
   - If unauthorized: Return 403 Forbidden or 404 Not Found
   ↓
3. Controlled Delivery Option A (Streamed Delivery)
   - Cloudflare Worker / Next.js Server streams bytes from R2
   - Sets headers: Content-Type, Content-Disposition, Cache-Control: private, no-store
   ↓
3. Controlled Delivery Option B (Short-Lived Presigned GET)
   - Generate signed R2 download URL valid for 60 seconds
   - Redirect client (HTTP 302 / 307)
```

---

## 4. Resume Version Immutability

PrepCraft treats job applications and resume versions as audit-grade career records:

```text
Application: "Staff SWE @ Stripe"
     ↓
Linked Resume Version: resume_v1 (object_key: .../v1/resume.pdf)
```

- When a candidate updates their resume for another application, **the existing R2 object is NEVER overwritten**.
- A new resume record and R2 object (`resume_v2`) is created.
- This ensures that historical applications always reference the exact resume version submitted at that specific point in time.

---

## 5. Security & Content Validation

All uploaded content must adhere to strict security constraints:

| Security Dimension | Enforcement Mechanism |
|---|---|
| **Max File Size** | 10 MiB for resumes and documents; 50 MiB for export bundles |
| **MIME Validation** | Client-declared MIME types are verified against byte magic numbers |
| **Filename Sanitization** | Original filenames are stripped of non-alphanumeric characters; R2 keys use UUIDs |
| **Path Traversal Guard** | Object keys are generated server-side; client cannot specify storage paths |
| **Content Security Policy** | Downloads served with `Content-Disposition: attachment` to prevent browser execution |

---

## 6. Bucket Isolation by Environment

Cloudflare R2 buckets are partitioned strictly by environment:

- **Development**: `prepcraft-dev-files`
- **Staging**: `prepcraft-staging-files`
- **Production**: `prepcraft-prod-files`

Development environments must never read from or write to staging or production buckets.
