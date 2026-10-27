# Production platform

PrepCraft uses Next.js for page composition and authenticated server operations, Supabase for identity and relational truth, and Cloudflare for asynchronous delivery and private bytes. The canonical app origin is https://prepcraft.vercel.app.

The platform Worker is https://prepcraft-platform.nxtqr.workers.dev. The notification Worker remains a separate bounded delivery service. D1, Redis and new global state containers are not required.

Private files and readiness have authenticated workspace routes. The production app is deployed in CodeWithEswar/prepcraft on Vercel and serves https://prepcraft.vercel.app. GitHub main is connected for subsequent production builds. Public pages, protected redirects and safe OAuth failures were verified on the live origin.

Local Workers use emulated R2 and localhost Supabase. Vercel preview cannot use the production Supabase host. Local connected development requires an explicit ALLOW_LIVE_BACKEND=true opt-in. No preview Worker has production secrets.
