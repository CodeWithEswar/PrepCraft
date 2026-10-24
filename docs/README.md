# PrepCraft documentation

Start with [system ownership](architecture/system-overview.md), the [repository move map](architecture/refactor-map.md), and [local development](runbooks/local-development.md).

- Product: [scope and domain map](product/product-overview.md), [feature ownership and build order](features/domain-map.md).
- Architecture: [frontend](architecture/frontend.md), [backend and authorization](architecture/backend.md), [database](architecture/database.md), [Cloudflare](architecture/cloudflare.md), [observability](architecture/observability.md).
- Security: [trust boundaries](security/threat-model.md), [RLS](security/rls.md).
- Operations: [migrations](runbooks/migrations.md), [deployment and rollback](runbooks/deployment.md), [worker failures](runbooks/worker-failure.md).
- Decisions: [ADR index](adr/README.md).
- Identity and presentation: existing `brand/` and `design/` retain asset provenance, the design system and visual validation.

These Markdown files are the living specification. Image references and milestone artifacts are supporting evidence. Update ownership documents when a boundary changes; a file tree alone is not an architecture decision.
