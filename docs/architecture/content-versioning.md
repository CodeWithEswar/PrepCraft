# Learning content versions

Release 1 seeds original prose/questions from lessons.server.json into versioned database rows. coverage.json is a structured outline, not evidence or a promise of published lessons. Seeds are reviewed as migrations and cannot be edited after deployment.

Published concept and activity payloads cannot be changed or demoted to draft. Publish a new version; prior versions may be deprecated/archived without altering their payload. Latest published version wins even when a newer draft exists. Active sessions and notes retain explicit version references. Workspace progress never changes canonical content.

Normal workspace owners have no content-author permissions or direct writes. No authoring UI/platform author role is added in this release. Private published answer keys also have an immutable update/delete guard. A future platform publishing service must implement its review workflow.
