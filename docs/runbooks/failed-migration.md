# Failed migration

Stop further schema deployment. Inspect migration history and the exact PostgreSQL error. Do not edit an applied migration, repair history to conceal a failure, or reset production.

Reproduce against a local schema and prepare a forward correction. Test SQL, roles and generated types. Review npx supabase db push --linked --dry-run before applying only the intended new migration. Take a backup appropriate to the actual plan before destructive transformations.
