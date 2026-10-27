export async function register(){const {registerServerMonitoring}=await import("@/lib/observability/monitoring.server");registerServerMonitoring()}
export async function onRequestError(...args:Parameters<typeof import("@sentry/nextjs").captureRequestError>){const {captureRequestError}=await import("@/lib/observability/monitoring.server");captureRequestError(...args)}
