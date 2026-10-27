# Runbook: Mock Review Failures

## 1. Symptoms
- User submits a mock session, but debrief page shows "Review generation pending" or an error banner.
- No record created in `mock_reviews` table for a completed `mock_sessions` row.

## 2. Diagnosis
1. Verify `mock_sessions.status` is `submitted` or `expired`.
2. Inspect server logs for `mock-evaluation-v1` normalization exceptions.
3. Check if all `mock_session_items` have valid `source_type` and difficulty snapshots.

## 3. Resolution
Trigger manual review generation via the evaluation service:
```bash
npm run script:generate-review -- --session-id <SESSION_UUID>
```
The session evidence is strictly preserved in `mock_session_items` and `mock_session_events`, so evidence is never lost.
