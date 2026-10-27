# State management

Postgres is durable source state. React state stores disposable view intent; local drafts are a clearly labeled recovery aid. TanStack Query stores authenticated remote projections. URL state stores shareable filters. No Redux or server-state mirror was introduced.

Never persist service credentials, upload capabilities or OAuth tokens in localStorage. Isolated preview pages need neither production identity refresh nor real mutations. Live Mock operations fail honestly until transactional persistence is connected.
