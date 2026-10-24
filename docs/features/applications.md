# Feature: Application Pipeline & Resumes

## Purpose
Tracks job applications across the end-to-end recruitment lifecycle, links scheduled interview rounds, and manages associated resume versions.

## Ownership
- `src/features/applications/`
- `src/features/resumes/`
- Target route: `src/app/(workspace)/w/[workspaceSlug]/applications/`

## Key Capabilities
- Kanban pipeline tracking 9 standard recruitment stages:
  1. `Saved`
  2. `Applied`
  3. `OA`
  4. `Technical I`
  5. `Technical II`
  6. `Final`
  7. `Offer`
  8. `Rejected`
  9. `Withdrawn`
- Stage transition history: append-only log of every stage change with timestamp and candidate notes.
- Company & Role metadata: job description link, salary range, location (Remote/Hybrid/Onsite), referral contact.
- Resume assignment: link specific resume versions to individual applications.
- Interview integration: seamlessly link scheduled technical rounds in `features/interviews/` to the parent application.

## Invariants
- Stage changes produce an `application.stage_changed` event.
- Stage transitions must be valid according to domain rules in `services/application-transition.ts`.
- Resume file metadata resides in PostgreSQL; binary files are stored in Cloudflare R2 via `cloudflare/workers/file-service/`.
