# Production platform

PrepCraft uses Next.js for page composition and authenticated server operations, Supabase for identity and relational truth, and Cloudflare for asynchronous delivery and private bytes. The canonical app origin is https://prepcraft.vercel.app.

The platform Worker is https://prepcraft-platform.nxtqr.workers.dev. The notification Worker remains a separate bounded delivery service. D1, Redis and new global state containers are not required.

Private files and readiness have authenticated workspace routes. The production URL currently returns 404 until a Vercel project is linked and deployed. Do not describe the app as publicly launched before that check passes.

Local Workers use emulated R2 and localhost Supabase. Vercel preview cannot use the production Supabase host. Local connected development requires an explicit ALLOW_LIVE_BACKEND=true opt-in. No preview Worker has production secrets.
