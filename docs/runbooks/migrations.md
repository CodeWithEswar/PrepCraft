# Migrations and schema changes

1. Start local Supabase and create a new migration with `supabase migration new descriptive_name`. Use 14-digit timestamps and snake_case descriptions.
2. Add related schema, constraints, indexes, grants and RLS together. Never modify an already-applied migration to rewrite history.
3. Add SQL and role/tenant tests beside the feature change. Explain non-obvious policy decisions in `supabase/policies`.
4. On a disposable local database, run `supabase db reset --local`, `npm run db:lint` and `npm run db:test`. Reset destroys local database contents; never point it at production.
5. Generate public database types with `supabase gen types typescript --local --schema public`, review the output, and replace `src/lib/supabase/types.ts`. Add schema/type drift CI with the first product schema.
6. Review migrations against staging, confirm backup/restore and rollback strategy, then use the approved deployment process. No remote migration is applied by this repository refactor.

Prefer expand/backfill/contract changes for live data. Roll back application behavior when safe; repair deployed schema with a new forward migration rather than deleting history. Coordinate irreversible changes and data restoration with the environment owner.

Seeds are disabled until actual reviewed catalogs exist. Later seed scripts must distinguish development examples from canonical licensed content. Never seed fake personal activity into production.
