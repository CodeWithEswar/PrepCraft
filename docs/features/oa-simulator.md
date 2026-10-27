# Online Assessment (OA) Simulator

## 1. Concept & Purpose
The OA Simulator represents the strictest mode of the Simulation Engine. It replicates the pressure and operational realities of automated screening rounds (e.g., HackerRank, CodeSignal, Karat, Amazon OA).

## 2. Policy Enforcement
- `pausePolicy: "forbidden"` — no pauses allowed under any circumstance.
- `navigationPolicy: "free"` — flexible navigation across questions via the Session Map or Mobile OA Drawer.
- `hintPolicy: "forbidden"` — zero hints or cues.
- `autoSubmit: true` — server-authoritative timer triggers automatic session finalization upon `expiresAt`.
- `questionTimerPolicy: "hard_limit"` — round-level deadline enforcement.

## 3. Server-Authoritative Expiration
The browser clock is never trusted for time truth. The expiration boundary is:
```text
expires_at = started_at + duration_seconds
```
If `server_now >= expires_at`, incoming mutations are rejected and the session is transitioned into `expired` / `submitted`. A stale browser clock at `00:03` cannot prolong an assessment.

## 4. Mobile OA Navigator
On mobile screens (`<768px`), question navigation transforms into a Shadcn `Drawer`, preventing 30 question chips from cluttering the viewport while retaining immediate access to question states (`unseen`, `viewed`, `attempted`, `answered`, `flagged`).
