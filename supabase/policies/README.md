# Policy rationale

Policy explanations belong here when a feature migration adds them. SQL migrations are the single deployable source; never maintain standalone policy SQL that can drift from migrations.

There are no application policies yet. The required actor/tenant matrix is in [security/rls.md](../../docs/security/rls.md). The baseline RLS test only enforces enabled RLS on exposed public application tables; every real feature requires operation-specific isolation fixtures.
