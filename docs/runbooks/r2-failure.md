# Private storage incident

Check the private bucket binding and environment first. Do not enable r2.dev or add a public domain to troubleshoot. Expired authorization and missing objects are different failures.

An uncertain upload remains pending until reconciliation/expiry; verify metadata and object checksum before retrying. Failed deletion stays DELETING or a failed job, preserving the workspace deletion barrier. Review unknown-object observations after a grace period; never sweep an entire bucket.
