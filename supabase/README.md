# PrepCraft Database & Supabase Infrastructure

This directory houses all database migrations, seeds, edge functions, security policies, and test suites for **PrepCraft**.

## Structure

```text
supabase/
├── config.toml           # Supabase CLI configuration
├── migrations/           # SQL migration files (chronologically ordered)
├── seed/                 # Seed data scripts
├── functions/            # Supabase Edge Functions
├── policies/             # Documented Row Level Security (RLS) policies
├── tests/
│   ├── sql/              # pgTAP / SQL tests
│   └── rls/              # RLS regression and security verification tests
└── README.md
```

## Guidelines

- All schema mutations must be executed through versioned migrations in `supabase/migrations/`.
- Never write ad-hoc database queries with elevated credentials inside Client Components.
- RLS must be enabled on every table exposed via PostgREST.
- Unit test RLS policies using `supabase/tests/rls/` before deploying to staging/production.
