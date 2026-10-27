# Data fetching

Server Components perform first reads. TanStack Query owns interactive remote snapshots; local state owns form/view intent. Stable central prefixes live in src/lib/query/keys.ts. Personal domains include user ID and workspace ID.

Notifications and revision searches debounce for 250 ms. Search values are part of query identity, so an older response cannot replace a newer filter result. Existing Today, Planning and Execution factories delegate to central prefixes without changing their cache contract.

File mutations invalidate only the exact owning user/workspace file key. File lists use descending created_at/id cursors and fetch thirty rows. Pending transfers/deletes poll every fifteen seconds. Avoid polling unchanged terminal views or broad global invalidation.
