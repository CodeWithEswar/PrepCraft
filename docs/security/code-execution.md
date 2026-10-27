# Security: Code Execution Sandbox

## 1. Untrusted Code Handling
Code submitted by users during coding mocks or OA simulations is considered completely untrusted. Arbitrary code is NEVER executed inside:
- Next.js Node.js server processes
- Supabase Postgres database engines
- Cloudflare application edge workers

## 2. Sandbox Resource Bounds
When routed to the code runner sandbox, strict quotas are enforced:
- Maximum execution time: 2000ms wall time
- Memory limit: 256MB
- CPU shares: 1 core maximum
- Process limit: 30 processes / threads
- Network: Disabled (egress blocked)
- Filesystem: Ephemeral in-memory tmpfs, destroyed immediately upon container exit
