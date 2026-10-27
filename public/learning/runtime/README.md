# Browser SQL runtime

Self-hosted root browser distribution from the pinned `@electric-sql/pglite@0.5.11` package installed in this repository. Includes its license. Do not hand-edit these vendor assets.

Used only by `/learning/sql-worker.js`, loaded on explicit Run. The worker starts an in-memory disposable sample database. It has no Supabase client or application credentials. Runs are limited by statement timeout, a parent watchdog, a read-only transaction, restricted one-query input and bounded output. Results are exploratory and never trusted as assessed evidence.

To refresh, copy the root `dist/*.{js,wasm,data}` and LICENSE files from the pinned package; rerun the SQL browser/security tests. No third-party CDN is contacted.
