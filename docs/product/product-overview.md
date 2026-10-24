# PrepCraft product scope

**Craft your way to ready.** PrepCraft is a preparation and tracking workspace for software-engineering candidates: Plan → Learn → Practice → Evaluate → Revise → Improve → Interview → Track applications.

Principles: show the next useful action; preserve evidence and history; make gaps understandable; keep the user in control of planning; distinguish practice evidence from outcome predictions; make workspace ownership explicit. The current public site is an illustrative preview, not a live question runner or saved workspace.

An **attempt** is a user's interaction with canonical question content. **Revision** schedules review; **mastery** interprets evidence; **readiness** compares evidence with a preparation goal. **Interview** means a real scheduled OA/interview, its preparation, rounds, journal and reflection. It does not mean an AI mock interviewer.

No AI mock interviews, video interviewing, D1, Prisma or new state libraries are included. Code execution requires a separate isolated provider/sandbox and a later phase. Do not execute untrusted code in the browser, Next server, Supabase or a Cloudflare Worker.

The conceptual relationship is:

```text
Workspace
├─ Planning → Today
├─ Questions → Attempts → Mistakes / Patterns / Revision
│                                      Revision → Mastery → Readiness
└─ Applications ↔ scheduled Interviews → preparation evidence
```

Arrows describe data/workflows, not permission to create circular module imports. Orchestration calls intentional feature APIs. See the [domain ownership map and sequence](../features/domain-map.md).
