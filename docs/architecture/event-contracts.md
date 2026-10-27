# Event contracts

PlatformJob v1 includes type, eventId, occurredAt, workspaceId, userId, correlationId, nullable causationId and a payload containing job ID and file.delete or attempt.observe. Zod rejects extra envelope fields. Private code, answers, notes, filenames and resumes are forbidden.

The consumer reloads authoritative records before processing. Queue body scope never substitutes for database authorization. Unknown versions are terminal contract failures, acknowledged with a sanitized operational record; known exhausted jobs enter the DLQ.

Never change the meaning of a released event field. Introduce a new version with a deliberate compatibility window and retain event identity across retry or replay.
