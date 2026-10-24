# 0003: Feature-oriented, server-first application

**Status:** Accepted, 24 October 2026.

**Context:** Routes and shared UI become difficult to maintain when they also own domain queries, mutation rules and permissions.

**Decision:** Routes compose deliberate feature APIs. Features own UI, schemas, domain services and server orchestration; shared infrastructure and presentation cannot depend upward. Keep Server Components as the default, client islands for interaction, and explicit server-only imports. Use one repository/application and the existing `@/*` alias.

**Alternatives:** Layer-only global folders, universal utility modules, broad mixed barrels, a premature packages workspace or per-feature Clean Architecture scaffolding.

**Consequences:** Public entry points are small, server/browser exports are separate, and dependency/cycle checks run in CI. Existing marketing CSS and assets remain unchanged. Future route groups and feature folders are created with real implementations, not empty placeholders.
