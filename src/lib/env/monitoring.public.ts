/** Literal public-variable access is required for Next.js build substitution. */
export function publicMonitoring(){return {dsn:process.env.NEXT_PUBLIC_SENTRY_DSN||undefined,environment:process.env.NEXT_PUBLIC_APP_ENV||"local"}}
