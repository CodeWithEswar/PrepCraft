# Notification provider outage

Check in-app notification state separately from external delivery. Provider outages must not erase the notification or imply successful email/push. Email remains disabled while the provider is placeholder.

Inspect sanitized provider codes and channel configuration. Respect unsubscribe/expired push state, quiet hours and per-delivery leases. Restore the provider, then retry bounded jobs using the notification pipeline’s existing delivery contract. Do not send test mail to real users.
