# Web Push

Permission is requested only by the Enable this browser button in a signed-in workspace. Preview mode never requests permission or registers a device. Secure context, Service Worker and PushManager support are checked first; denial gives a recovery explanation and keeps the in-app inbox available.

Subscriptions are owner-scoped, limited to five active devices and SHA-256 deduplicated. Public metadata contains a device name/provider and revocation timestamps. Endpoint, p256dh and auth live in a private table with no direct API-role grants. A revoked device is excluded immediately; 404/410 responses revoke its credentials.

The Worker uses @block65/webcrypto-web-push 2.0.0, native WebCrypto, VAPID and aes128gcm. Push URLs must be HTTPS on the explicit FCM, Mozilla, Apple or Windows allowlist, with no credentials or custom port; redirects are rejected. Payloads have a short TTL, an expiry and an allowlisted same-origin inbox destination.

Private previews say only that a preparation update is ready. Detailed previews require explicit preference. Successful device submissions are persisted under the delivery lease. Ambiguous network acceptance stops automatic retries. Known transient failures retry; visible duplicates are additionally controlled by a stable push Topic, notification tag and bounded IndexedDB receipt store (48 hours, at most 500 IDs). This is not a claim of exactly-once network delivery.

Rotating VAPID keys requires replacing existing browser subscriptions. No user is subscribed merely because the platform has VAPID keys.
