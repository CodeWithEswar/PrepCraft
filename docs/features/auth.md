# Feature: Authentication & Identity

## Purpose
Manages user authentication, OAuth lifecycle, identity persistence, and secure session state.

## Ownership
- `src/features/auth/`
- Target route: `src/app/(auth)/login/` and callback: `src/app/auth/callback/`

## Key Capabilities
- Google OAuth 2.0 via Supabase Auth
- Secure session cookie lifecycle via `@supabase/ssr`
- Post-login onboarding redirection resolver
- Profile creation on initial signup

## Dependencies
- `@/lib/supabase/client` & `@/lib/supabase/server`
- Supabase `auth.users` system table
- `public.profiles` table
