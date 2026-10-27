# PrepCraft — Preparation Templates System
Phase 08: Domain Specification

## Overview
A **Preparation Template** answers the foundational product question:
> **"What should someone preparing for this type of role focus on, and how should PrepCraft organize that preparation?"**

PrepCraft treats Preparation Templates as a first-class, versioned product domain rather than hard-coded presets or static JSON cards.

## Core Rules
1. **Templates Recommend Preparation**: Templates provide curriculum structure, recommended priorities, planning weights, DSA patterns, interview round guidance, and readiness expectations.
2. **Workspaces Own Preparation**: A workspace pins to an immutable published template version (`template_version_id`, `version_number`). The workspace holds its effective curriculum and custom overrides.
3. **Users Own Progress**: Question attempts, session logs, revision intervals, mistakes, and mastery evidence remain independent from template definitions.
4. **Historical Reproducibility**: Template versions are immutable once published. Workspaces are never silently mutated when a newer template version is released.

## Supported Starter Templates
- **General Software Engineer (`general-swe`)**: Comprehensive fallback covering DSA, Language, CS Fundamentals, Databases, Projects, and Behavioral.
- **Amazon Software Engineer (`amazon-sde` v1 & v2)**: High DSA & Behavioral emphasis with Online Assessment and Leadership Principle readiness criteria.
- **Frontend Engineer (`frontend-engineer`)**: TypeScript, React, Browser Fundamentals, UI Architecture, and DSA essentials.
- **Backend Engineer (`backend-engineer`)**: Distributed Systems, APIs, Databases, Concurrency, and System Design.
- **Full-Stack Engineer (`fullstack-engineer`)**: End-to-end web engineering, API design, authentication, and DSA.

## Template Types
- `general`: Broad engineering curriculum.
- `company`: Company-oriented where role specificity is broad.
- `role`: Role-focused curriculum (e.g. Frontend Engineer).
- `company_role`: Highly targeted (e.g. Amazon SDE).
- `custom`: Custom workspace curriculum.

## Lifecycle States
- `draft` → `review` → `published` → `deprecated` → `archived`.
- Deprecated versions remain valid and readable for existing workspaces, but are hidden from normal onboarding selection.
