# Revision Queue

Eligibility is personal to an authenticated user and authorized workspace. States are scheduled, snoozed, retired and archived. Due means due_at <= server now; overdue means the due date precedes the workspace-local current date. Later today is not yet due.

Due candidates precede future work. Ranking adds bounded overdue pressure (40 over 14 days), last outcome (failed 30, major assistance 22, minor 12, independent 0), up to three prior failures (4 each) and three active snoozes (2 each). Future items receive a -100 eligibility offset. Ties use due timestamp then stable ID. Reasons expose evidence, never raw scores. High is at least 30, Medium at least 12, otherwise Low; this is operational priority, not a memory probability.

Server search covers prompt title/topic. Filters cover due state, outcome, difficulty and exact topic. Pages contain at most 40 rows plus one lookahead, using a frozen ranking instant and score/due/id keyset. Changed evidence may alter the queue; refresh restarts current ordering. History uses timestamp plus UUID keysets so equal timestamps are retained.

Query keys include workspace and user. Mutations invalidate Revision, Today and Planning. BroadcastChannel sends only scoped change signals. No per-second writes or broad realtime subscription is used. Mutations require the latest server version.
