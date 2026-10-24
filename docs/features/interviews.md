# Feature: Real Interview Tracking & Journal

## Purpose
Enables candidates to track real-world scheduled interviews, manage upcoming Online Assessments (OAs), organize interview rounds, execute Interview Day Mode, and reflect on encountered questions.

## Ownership
- `src/features/interviews/`
- Target route: `src/app/(workspace)/w/[workspaceSlug]/interview/`

## Critical Scope Boundary
**PrepCraft does NOT provide AI mock interviews, synthetic automated interviewers, or video avatar bots.**

This domain is dedicated exclusively to **real interviews and preparation workflows**:

## Key Capabilities
- **Scheduled Interview Tracking**: Track real upcoming rounds (Company, Role, Round Type, Date/Time, Interviewer info).
- **Online Assessment (OA) Tracker**: Deadline tracking, platform (Hackerrank, CodeSignal, Karat), test duration, status.
- **Round Breakdown**: Track multi-stage loops (Recruiter Screen, Technical I, Technical II, System Design, Hiring Manager, Bar Raiser).
- **Interview Day Mode**: Clean, distraction-free cockpit before and during an interview round showing:
  - Key company-specific reminders
  - Candidate questions to ask the interviewer
  - Elevator pitch & STAR behavioral cheat-sheet
  - Technical trade-off summary
  - Round countdown timer
- **Encountered Questions Journal**: Log actual questions asked by the company immediately after the round.
- **Post-Interview Reflection**: Structured retro on what went well, where communication lagged, and what technical gaps were exposed.

## Invariants
- Interviews link to the candidate's active `workspace_id`.
- Interviews link optionally to an `application_id`.
- No AI mock interview infrastructure, speech recognition, or synthetic video models are introduced.
