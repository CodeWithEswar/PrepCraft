# Experience Plane Architecture — Frontend, UI & Client State

The Experience Plane delivers PrepCraft's user interface across desktop, tablet, and mobile surfaces. It is responsible for presentation, layout composition, user interactions, accessible navigation, and client-side server-state caching.

---

## 1. Core Experience Principles

1. **Server Components by Default**: Pages, layouts, and data composition default to Server Components. Secrets remain on the server, bundle sizes remain minimal, and initial render times are optimized.
2. **Interactive Client Islands**: `"use client"` is applied strictly to localized interactive leaves (practice timers, code editors, filter controls, command menus, dialogs, motion visuals). It is never applied to feature roots or top-level layouts without necessity.
3. **Selective TanStack Query**: TanStack Query is used exclusively for interactive server-state scenarios (e.g. live-filtered problem tables, pipeline drag-and-drop boards). It is not wrapped around every Server Component read.
4. **Theme Independence**: The visual design system (Graphite Monochrome × Smoked Sienna `#A15F4B` × Mineral Glass) is decoupled from domain logic. Domain services and server operations remain purely headless and theme-agnostic.

---

## 2. Route Layout & Surface Strategies

The application is structured into distinct App Router route groups:

| Route Surface | Path Pattern | Data Strategy | Primary Responsibility |
|---|---|---|---|
| **Marketing** | `/(marketing)` | Server-rendered static shell | Public landing, curriculum preview, feature showcases |
| **Auth** | `/(auth)` | Server Component + Client Form | Google OAuth trigger, login, callback exchange |
| **Today** | `/w/[slug]/today` | **Server-First** | Daily study plan, due spaced repetition cards, immediate priorities |
| **Practice** | `/w/[slug]/practice` | Server initial + TanStack Query | Question library, filterable tables, timers, solution editor |
| **Progress** | `/w/[slug]/progress` | Server initial + Recharts/D3 | Mastery radar, solve consistency charts, readiness gates |
| **Applications**| `/w/[slug]/applications` | Server initial + Interactive Board | Recruitment pipeline stages, interview dates, resume versions |
| **Settings** | `/w/[slug]/settings` | Server reads + Form Actions | Workspace preferences, targets, timezone configuration |

### Persistent Workspace Shell
Navigating between `today`, `practice`, `progress`, and `applications` within a workspace retains the outer workspace shell (sidebar, command palette, user avatar). The shell is not destroyed and remounted during sub-route transitions.

---

## 3. Server Components vs Client Islands

```text
┌──────────────────────────────────────────────────────────────┐
│  Server Component (/w/[slug]/practice/page.tsx)              │
│                                                              │
│  • Authenticates caller & verifies workspace membership      │
│  • Performs initial queries (getQuestions, getTags)          │
│  • Emits static layout, headers, and metadata                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Client Island: <QuestionFilterBar /> ("use client")   │  │
│  │  • Manages URL search params & filter state            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Client Island: <PracticeTimer /> ("use client")       │  │
│  │  • Local stopwatch state & audio chime                 │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Client Island: <QuestionDataTable /> ("use client")   │  │
│  │  • TanStack Query for interactive sorting & pagination │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Responsive Viewport Architecture

PrepCraft's UI is designed intentionally across three responsive tiers:

| Tier | Breakpoint | Layout Paradigm & Payload Rules |
|---|---|---|
| **Desktop** | $\ge 1280\text{ px}$ | Multi-pane split workspaces (problem description + code editor), sticky filter rails, full Recharts time-series |
| **Tablet** | $768\text{ – }1279\text{ px}$ | Collapsible side navigation, stacked practice panes, touch-friendly 44px tap targets |
| **Mobile** | $< 768\text{ px}$ | Linear single-column flow, bottom drawer sheets, streamlined data payloads |

### Mobile Data Budget Rule
Mobile devices must not download large, complex desktop-only datasets and hide them via CSS `hidden md:block`. Server Components partition data payloads according to client hints or deliver tiered representations to keep mobile network transfers minimal.

---

## 5. Forms & Validation

- **Forms Engine**: `react-hook-form` with `@hookform/resolvers/zod`.
- **Validation**: All form inputs are validated using the exact same Zod schema that guards the server trust boundary in `src/features/<feature>/schemas/`.
- **Error Presentation**: Inline accessible field errors (`aria-invalid="true"`, `aria-describedby`) linked to inputs.

---

## 6. Accessibility (WCAG Compliance)

The Experience Plane adheres to high accessibility standards:
- **Semantic HTML**: Proper heading hierarchy (`h1` → `h2` → `h3`), `<main>`, `<nav>`, `<aside>`, `<section>`.
- **Focus Management**: Focus trapped in modals and drawers via `@radix-ui` / `shadcn` primitives; focus restored upon close.
- **Keyboard Navigation**: All interactive elements (buttons, filters, tabs, timers) are 100% operable via keyboard.
- **Screen Reader Support**: Live regions (`aria-live="polite"`) announce timer updates and asynchronous mutation results.
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` by disabling non-essential transitions in Motion components.

---

## 7. Progressive Web App (PWA) & Offline Strategy

PrepCraft is **web-first**, with future installable PWA capabilities:
- **Online**: Standard dynamic server orchestration and real-time validation.
- **Intermittent Network Loss**:
  - Local client UI remains responsive for currently open questions and notes.
  - Informative toast warns candidate: *"Offline. Changes will sync once network is restored."*
  - Server mutations are not falsely reported as committed until confirmed by PostgreSQL.
  - Automatic reconnection revalidation via TanStack Query (`refetchOnReconnect: "always"`).
