# SQL learning isolation

Exploratory SQL runs only in a disposable PGlite Web Worker using self-hosted pinned 0.5.11 distribution/license. It has no Supabase client, credentials or production schema. There are no network-capable extensions. Each run is a fresh in-memory fixture and terminates afterward.

Defense layers: bounded input; single SELECT/read-only WITH allow-list; read-only transaction; statement timeout; parent watchdog; work-memory/temp-file limits; returned row/output caps. The string filter is a convenience constraint, not a SQL parser or the sole security boundary. Browser memory isolation is not an OS container or a guaranteed hard memory quota. A malicious local user can alter their own worker, so these outputs never produce trusted assessment evidence.

Production RPCs accept answers only. User SQL is never interpolated into an application database query or executed by a Supabase RPC. Tests check real SELECT, syntax errors, prohibited writes and absence of application data API requests.
