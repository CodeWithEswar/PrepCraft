# Security model

Browser input, Server Actions, queue envelopes and file-transfer requests are trust boundaries. Authenticated SQL checks live workspace membership independently of route checks. Production origin is exact; Worker CORS rejects other origins and all token query strings.

Server headers include nosniff, frame denial, no-referrer, constrained browser capabilities, HSTS and a CSP limiting frame ancestors, base URI and object embeds. This is not a full nonce-based script CSP.

Private routes return no-store. Service keys stay in encrypted Cloudflare secrets. A scoped Supabase PAT is recommended for future CI/operator automation; the existing interactive CLI credential was used only for the linked project.

Before account deletion, revoke sessions, enforce a live-account/session barrier, delete private bytes through durable jobs, verify completion, then delete relational state and finally Auth identity. JWT expiry alone does not guarantee immediate revocation. This phase does not execute account deletion.
