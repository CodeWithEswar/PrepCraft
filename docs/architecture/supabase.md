# Supabase boundaries

Database schema changes are append-only migrations applied through the pinned CLI. src/lib/supabase/types.ts is generated from the actual public schema. Row aliases refer to those generated tables; SQL-null arguments are handled explicitly where generator parameter types cannot express nullability.

Direct writes to private-file tables are revoked. The public PostgREST facades are SECURITY INVOKER; narrow private functions validate verified identity, live membership and workspace state. Service operations also check the current service_role identity.

The audited bootstrap now binds p_user_id to auth.uid(). Anonymous execution was revoked on the six specifically audited workspace functions. Their authenticated contracts and OIDs were preserved. Broad relocation of all privileged functions was not performed.
