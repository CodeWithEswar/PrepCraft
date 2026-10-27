# Notification preferences

Channel resolution uses workspace category, workspace wildcard, account category, account wildcard, then product defaults. Defaults enable in-app notifications and disable email/push. Quiet hours resolve from the workspace wildcard or account wildcard, with workspace timezone fallback. Private push previews are the default.

Preferences support account defaults and workspace overrides. Removing a workspace override restores inheritance. External channels must be configured before they can be enabled. A delivery also requires the channel on its reminder, current user preference, valid source and live membership.

Quiet hours default to 22:30–07:00. Start is inclusive and end exclusive. Windows crossing midnight defer to the next valid local end. Important notifications do not bypass the policy. Only an explicitly created custom reminder can disable quiet-hour handling.

Email is a placeholder: the UI explains the missing provider, and EMAIL_ENABLED is false. Merely adding a library or generating a report never enables sending.
