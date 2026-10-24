## Outcome

What problem does this solve, and which feature owns it?

## Validation

List commands actually run and results. Explain any unavailable checks.

## Boundaries

- [ ] Routes compose features; shared UI/infrastructure has no feature imports.
- [ ] Inputs, authorization, RLS and workspace isolation are addressed where relevant.
- [ ] No secrets or sensitive payloads reach browser bundles or logs.
- [ ] Schema changes use new migrations with SQL/RLS tests.
- [ ] User-visible behavior and documentation agree.
