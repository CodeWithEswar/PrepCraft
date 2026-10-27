import type { PreparationTemplate, RoleFamily } from "../types/onboarding.types"

export const CANONICAL_TEMPLATES: PreparationTemplate[] = [
  {
    id: "amazon-sde",
    name: "Amazon SDE",
    roleFamily: "Software Engineer",
    targetCompany: "Amazon",
    description: "Curated curriculum targeting Amazon Online Assessment (OA), Data Structures, Core CS trade-offs, and Leadership Principles.",
    focusAreas: ["DSA", "Java", "CS Fundamentals", "System Design", "Leadership Principles"],
    tracks: [
      { name: "DSA Foundations", minutes: 240, description: "Arrays, Strings, Hash Maps & Two Pointers" },
      { name: "Java & Collections", minutes: 120, description: "OOP, memory models, and standard collections performance" },
      { name: "Core CS Fundamentals", minutes: 120, description: "OS, concurrency basics, and database indexing" },
      { name: "Leadership Principles", minutes: 60, description: "Customer Obsession & Ownership STAR story formulation" },
      { name: "Deliberate Revision", minutes: 60, description: "Interval spaced repetition of past mistakes" },
    ],
    version: 1,
    status: "active",
    lastReviewedAt: "2026-10-24T00:00:00Z",
  },
  {
    id: "general-swe",
    name: "General Software Engineer",
    roleFamily: "Software Engineer",
    targetCompany: null,
    description: "Comprehensive multi-round curriculum covering patterns, algorithms, system concepts, and behavioral competencies.",
    focusAreas: ["Data Structures", "Algorithms", "Core CS", "Problem Solving", "Behavioral"],
    tracks: [
      { name: "Data Structures & Patterns", minutes: 240, description: "Sliding window, trees, graphs, and dynamic programming" },
      { name: "Algorithms & Complexity", minutes: 180, description: "Sorting, searching, and recursion analysis" },
      { name: "System Concepts", minutes: 90, description: "Networking, caches, and database transactions" },
      { name: "Behavioral Competencies", minutes: 60, description: "Communication, conflict resolution, and trade-offs" },
      { name: "Practice & Revision", minutes: 30, description: "Weekly consolidation of deliberate practice" },
    ],
    version: 1,
    status: "active",
    lastReviewedAt: "2026-10-24T00:00:00Z",
  },
  {
    id: "frontend-engineer",
    name: "Frontend Engineer",
    roleFamily: "Frontend Engineer",
    targetCompany: null,
    description: "Deep focus on modern JavaScript, browser internals, component architecture, CSS layout, and accessibility.",
    focusAreas: ["JavaScript/TypeScript", "React & DOM", "CSS & Layout", "Frontend Architecture", "Behavioral"],
    tracks: [
      { name: "JS Engine & Async Runtime", minutes: 210, description: "Event loop, microtasks, closures, and promises" },
      { name: "React Performance & Hooks", minutes: 210, description: "State management, re-renders, and component boundaries" },
      { name: "CSS, Grid & Responsive Design", minutes: 90, description: "Subgrid, animations, and container queries" },
      { name: "Accessibility & Core Web Vitals", minutes: 60, description: "ARIA roles, keyboard trap prevention, and LCP/INP" },
      { name: "Behavioral & Project Defense", minutes: 30, description: "Technical trade-offs and team collaboration" },
    ],
    version: 1,
    status: "active",
    lastReviewedAt: "2026-10-24T00:00:00Z",
  },
  {
    id: "backend-engineer",
    name: "Backend Engineer",
    roleFamily: "Backend Engineer",
    targetCompany: null,
    description: "Focused on reliable distributed systems, database query design, concurrency, API contracts, and high availability.",
    focusAreas: ["APIs & Concurrency", "Databases & SQL", "Distributed Systems", "DSA", "Behavioral"],
    tracks: [
      { name: "Relational Data Modeling & Indexing", minutes: 240, description: "Postgres EXPLAIN, locks, isolation levels, and migration design" },
      { name: "API Design & Asynchronous Queues", minutes: 180, description: "Idempotency keys, message brokers, and retry semantics" },
      { name: "Concurrency & Distributed State", minutes: 120, description: "Raft, consensus, caches, and rate limiting" },
      { name: "Algorithmic Problem Solving", minutes: 120, description: "Graphs, search, and memory-constrained processing" },
      { name: "Behavioral & Incident Reviews", minutes: 60, description: "Post-mortems and architecture decision records" },
    ],
    version: 1,
    status: "active",
    lastReviewedAt: "2026-10-24T00:00:00Z",
  },
  {
    id: "fullstack-engineer",
    name: "Full-Stack Engineer",
    roleFamily: "Full-Stack Engineer",
    targetCompany: null,
    description: "Balanced end-to-end preparation connecting client state, server boundaries, databases, and deployment pipelines.",
    focusAreas: ["Frontend & State", "Backend APIs", "Database Design", "End-to-End Projects", "Behavioral"],
    tracks: [
      { name: "End-to-End System Architecture", minutes: 240, description: "Edge routing, Server Components, and API boundaries" },
      { name: "Database Schema & Optimization", minutes: 180, description: "Normalization, indexing, and transactional integrity" },
      { name: "Interactive UI & State Synchronization", minutes: 120, description: "Optimistic updates, websockets, and caching" },
      { name: "Core Coding & Algorithms", minutes: 120, description: "Practical problem solving and data structures" },
      { name: "Behavioral & Product Thinking", minutes: 60, description: "User impact, product metrics, and engineering trade-offs" },
    ],
    version: 1,
    status: "active",
    lastReviewedAt: "2026-10-24T00:00:00Z",
  },
]

export function recommendTemplate(
  roleFamily: RoleFamily | string | null | undefined,
  companyName: string | null | undefined
): string {
  const normCompany = (companyName || "").trim().toLowerCase()
  if (normCompany.includes("amazon")) {
    return "amazon-sde"
  }

  const normRole = (roleFamily || "").trim().toLowerCase()
  if (normRole.includes("frontend")) {
    return "frontend-engineer"
  }
  if (normRole.includes("backend")) {
    return "backend-engineer"
  }
  if (normRole.includes("full-stack") || normRole.includes("fullstack")) {
    return "fullstack-engineer"
  }

  return "general-swe"
}

export function suggestWorkspaceName(
  roleName: string | null | undefined,
  companyName: string | null | undefined
): string {
  const company = (companyName || "").trim()
  const role = (roleName || "").trim()

  if (company && role) {
    if (company.toLowerCase() === "amazon" && role.toLowerCase().includes("software engineer")) {
      return "Amazon SDE I"
    }
    return `${company} ${role}`
  }
  if (company) {
    return `${company} Interview Prep`
  }
  if (role) {
    if (role.toLowerCase() === "software engineer") {
      return "General SDE Preparation"
    }
    return `${role} Preparation`
  }
  return "General SDE Preparation"
}
