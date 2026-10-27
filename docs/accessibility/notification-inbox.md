# Notification inbox accessibility

The inbox uses headings, labeled selection controls, named action menus, keyboard-accessible view buttons and non-color state text. Unread dots have an image role and accessible name. Preferences include their visible label in the accessible name. Errors announce with role=alert; asynchronous loading and form success use status text.

Base UI/shadcn dialogs and sheets manage focus, Escape and focus restoration. Below 1400px, notification context uses a sheet; smaller screens also access the preferences rail through a named button. Form labels, weekday pressed state, channel labels and IANA timezone explanations remain explicit. Hydration guards keep controls disabled until handlers are attached.

Both themes use near-solid readable surfaces, a restrained Sienna accent, visible focus rings, thin customized scrollbars and reduced-motion overrides. The full weekly report reuses Analytics chart descriptions and data tables rather than hiding evidence in color alone.

Run node scripts/audit-notifications.mjs against the production build. The audit covers eleven viewport widths, including 320px plus inbox, detail, settings, reminder editor and full report in both themes on desktop and mobile. Results and screenshots are recorded under docs/design/workspace. Automated results complement, rather than replace, keyboard and assistive-technology review.
