# Isolated learning execution

Status: Accepted

Date: 2026-10-25

Decision: Exploratory SQL runs in a disposable browser PostgreSQL fixture. Java requires an external sandbox and is currently unavailable. Neither executes against production/application infrastructure.

Consequences: explicit lifecycle, platform-only publication, honest evidence and capability states. See the learning architecture/security documents for contracts and limitations.
