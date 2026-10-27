# 0081 — Generate database types

Status: accepted for the current platform implementation.

Generate the public contract from Supabase, alias row types and fail CI on local schema/type drift. Keep the generator pinned with the project.

Consequences: verify the boundary with the platform tests and operational checks; changes to this contract require an explicit forward migration or version.
