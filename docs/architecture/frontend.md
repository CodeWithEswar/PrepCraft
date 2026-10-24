# Frontend boundaries

## Routing

`src/app/layout.tsx` owns the document, fonts, application metadata and global providers. `src/app/(marketing)/page.tsx` owns `/` metadata and renders the marketing feature's public `MarketingPage` export. Its group layout imports the existing marketing CSS in the original order. URLs, anchors, interaction behavior and artwork are preserved.

`src/app/dev/brand` remains the existing development inspection surface; production returns 404 unless explicitly enabled. No additional public routes are created merely to fill the target tree.

Later surfaces are reserved as follows:

| Surface | First real routes | Responsibility |
| --- | --- | --- |
| `(auth)` | `/login` | Identity UI; public callback at `app/auth/callback` |
| `(onboarding)` | `/onboarding` | Initial setup and resolver |
| `(workspace)/w/[workspaceSlug]` | `today`, `practice`, `interview`, `progress`, `plan`, `applications`, `settings` | Membership-authorized workspace experience |

Each group gets its layout when it has real behavior. A slug only identifies a workspace; it never proves access. Error/loading/empty/denied states belong to the route or feature that can meaningfully recover.

## Server and client

Pages/layouts and static section composition stay Server Components. Theme selection, tabs, dialogs, slideshow controls, Motion and browser APIs are client islands. Global providers remain in `src/providers`; feature providers remain local. React Query is for interactive client data, URL state for navigable filters, and local React state for ephemeral controls. No Redux or new global state library is introduced.

Shared primitives remain `components/ui`, brand React components remain `components/brand`, and Hugeicons stays behind `components/app-icon`. No business logic is moved into these components. Marketing implementation remains feature-owned, including its existing uniquely prefixed CSS. Do not introduce additional unrelated global selectors there; scope new feature styling locally.

## Feature contract

Create `components`, `server`, `services`, `schemas`, `hooks`, `types` and tests only as needed. Server entry points import `server-only`; pure services take data as arguments and do not import React, request cookies or database clients. A public barrel exports intentional entry points, not every file. Pure types must not pull server runtime code into clients.

Existing `@/* → src/*` is the single application alias. The shared result contract is in `lib/validation/operation-result.ts`. Cross-feature tests are in `tests`; small feature/component tests may remain colocated. See [ADR 0003](../adr/0003-feature-oriented-frontend.md).
