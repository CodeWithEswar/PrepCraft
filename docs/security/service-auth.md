# Service authentication

Workers hold one encrypted Supabase service identity. The public app receives only publishable/anon keys. PostgREST service facades call private functions which check service_role again. No public administrative HTTP endpoint was added to the platform Worker.

The service key is inherently privileged across its Supabase project. Restrict Worker account access, rotate via encrypted Wrangler secret input, review deployments, and prefer scoped operator PATs. Never copy it into Vercel NEXT_PUBLIC variables or queue payloads.

User file capabilities are high-entropy random strings with only SHA-256 hashes persisted. They are not session credentials and cannot authorize a different file or purpose. Origin checks supplement, never replace, the capability and current database authorization.
