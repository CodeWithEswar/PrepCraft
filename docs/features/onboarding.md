# Feature: Onboarding

## Purpose
Guides a newly authenticated candidate through initial profile setup, target definition, and workspace initialization.

## Ownership
- `src/features/onboarding/`
- Target route: `src/app/(onboarding)/onboarding/`

## Key Capabilities
- Target company selection (e.g., Tier-1 Tech, Fintech, High-Growth Startup)
- Primary programming language and track selection
- Preparation timeline and target interview date configuration
- Initial workspace creation with slug generation

## Invariants
- Candidates must complete onboarding before accessing `/w/[workspaceSlug]/today`.
- Onboarding cannot be re-executed for an active workspace without explicit reset.
