# RLS audit

All new public/private platform tables enable and force RLS. Owner-plus-live-membership policies permit file/audit reads only. Authenticated direct writes and anonymous access are denied. Public worker/replay facades are invokers granted only to service_role.

Tests cover cross-workspace denial, same-workspace other-user isolation, direct write denial, upload verification, duplicate leases, one-use downloads, stale deletion versions and membership revocation during upload. Live rolled-back verification tested the scoped bootstrap guard.

The latest security advisor review retains six warnings for intentionally authenticated legacy SECURITY DEFINER workspace functions plus leaked-password protection disabled. Anonymous execution warnings were repaired. These remaining warnings require review; do not claim a clean advisor report.
