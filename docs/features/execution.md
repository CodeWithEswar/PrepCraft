# Execution Engine

The unified Execution Engine owns session lifecycle, authoritative time, working-state persistence, hint evidence, question progression and post-attempt evidence. It does not own a Question Library, code evaluation, Revision scheduling, Mastery, Readiness or Mistake Journal aggregation.

`/w/[workspaceSlug]/practice` resolves the user/workspace, active session and recent history. A launch accepts an explicitly supplied question snapshot or an authorized custom Today task. Preflight is local; the session begins only when the user confirms Start. The canonical route is `/w/[workspaceSlug]/session/[sessionId]`; mode comes from the stored session, never a trusted URL parameter. `/preview/practice` provides clearly labelled, non-running design examples for all three modes.

The Focus Chamber replaces the ordinary app chrome with the PrepCraft mark, mode/context, calibrated timer, essential controls, question, working surface and appropriate context. Solid graphite/mineral working surfaces retain legibility; glass stays restrained. Mobile switches between question and working surface, uses a context Drawer, and keeps primary controls at the bottom. Hugeicons and the existing shadcn primitives are used throughout.

The audit found no Question Library or Code Runner. Session prompt snapshots are bounded user-provided material, not a duplicate public catalog. Code and written answers can be saved; Run remains unavailable, and neither Finish nor Mark answered implies correctness. Canonical pattern IDs reuse the existing text-key catalog. No AI interviewer, voice/video room or automatic communication assessment is present.

Today can launch eligible planned work, resume active sessions and surface pending reflections. Session time comes from real active intervals, separate from task estimates. A final debrief may explicitly complete its linked custom Today task through Today's existing mutation contract. A failure there does not roll back the saved attempt; historical-day tasks require schedule review. Follow-ups resolve an owned attempt and open a prefilled Planning form for explicit confirmation.

Verification covers portable timer/policy/state/event tests, UI interaction tests, actual PostgreSQL/RLS execution, browser mode controls, responsive layouts and accessibility audits. Local PostgreSQL tests use PGlite because Docker is absent; the full Supabase extension/pgTAP chain remains a CI check. The browser design preview does not create production progress.
