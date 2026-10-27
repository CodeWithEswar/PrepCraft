# Private file lifecycle

PENDING_UPLOAD → READY or FAILED; deletion moves through DELETING → DELETED. Supabase holds scope, category, MIME, size, SHA-256, version and timestamps. The browser receives a scoped DTO without object keys.

The authenticated server authorizes an opaque capability whose hash is stored in Postgres. It travels only in an Authorization header. Upload grants expire after five minutes and permit at most three leased attempts; download grants expire after one minute and are consumed at claim. This is a capability transfer endpoint, not an S3 presigned URL.

The Worker rechecks membership, state, expiry and environment. It bounds reads to 10 MB, checks signatures or UTF-8 text, verifies SHA-256, and conditionally creates an object without overwriting an existing key. Finalization checks membership again. Downloads use attachment and nosniff headers with no-store. There is no malware-scanning claim.

The account limit is 100 MB and the workspace limit is 100 files. Pending uploads expire after one hour. Ready files are checked in rotating batches. Unknown R2 keys are recorded for operator review and are never automatically deleted. Workspace deletion is blocked until bytes are confirmed deleted.
