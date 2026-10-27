import type { MockMode, SessionBlueprint } from "../types/mock.types"
import { getMockPolicy } from "../policies/mock-policy-v1"
import { getOAPolicy } from "../policies/oa-policy-v1"

export const CANONICAL_BLUEPRINTS: SessionBlueprint[] = [
  {
    id: "blueprint-amazon-sde-mixed",
    version: 1,
    name: "Amazon SDE Technical Mock",
    description: "Structured 60-minute simulation combining Coding DSA, CS Fundamentals, and Project Deep Dive.",
    mode: "mixed",
    durationMinutes: 60,
    difficulty: "mixed",
    sourceType: "platform",
    sectionsConfig: [
      { type: "coding", title: "Coding (DSA)", count: 2, durationMinutes: 25 },
      { type: "cs_fundamentals", title: "CS Fundamentals", count: 3, durationMinutes: 20 },
      { type: "project_deep_dive", title: "Project Deep Dive", count: 1, durationMinutes: 15 },
    ],
    policySnapshot: {
      ...getMockPolicy("mixed", 60),
      pausePolicy: "forbidden",
      autoSubmit: true,
      allowScratchpad: true,
    },
    whyRecommended: [
      "Graph evidence is still limited",
      "OS synchronization needs practice",
      "Interview scheduled in 6 days",
    ],
    status: "published",
  },
  {
    id: "blueprint-quick-coding-30",
    version: 1,
    name: "30 min Coding Mock",
    description: "Timed DSA problem solving session under simulated whiteboard / assessment conditions.",
    mode: "coding",
    durationMinutes: 30,
    difficulty: "medium",
    sourceType: "platform",
    sectionsConfig: [
      { type: "coding", title: "DSA Problem Solving", count: 2, durationMinutes: 30 },
    ],
    policySnapshot: getMockPolicy("coding", 30),
    whyRecommended: [
      "Recent attempts show deferred edge-case testing",
      "Strengthen time allocation under 15 min per question",
    ],
    status: "published",
  },
  {
    id: "blueprint-mixed-technical-45",
    version: 1,
    name: "45 min Mixed Technical",
    description: "Balanced simulation across algorithms, core fundamentals, and behavioral articulation.",
    mode: "mixed",
    durationMinutes: 45,
    difficulty: "mixed",
    sourceType: "platform",
    sectionsConfig: [
      { type: "coding", title: "Coding", count: 1, durationMinutes: 20 },
      { type: "cs_fundamentals", title: "CS Fundamentals", count: 4, durationMinutes: 15 },
      { type: "project_deep_dive", title: "Project Discussion", count: 1, durationMinutes: 10 },
    ],
    policySnapshot: getMockPolicy("mixed", 45),
    whyRecommended: ["Holistic evaluation across multiple preparation dimensions"],
    status: "published",
  },
  {
    id: "blueprint-cs-fundamentals-20",
    version: 1,
    name: "20 min CS Fundamentals",
    description: "Rapid-fire conceptual and objective evaluation across Java, SQL, OS, and Networks.",
    mode: "cs_fundamentals",
    durationMinutes: 20,
    difficulty: "medium",
    sourceType: "platform",
    sectionsConfig: [
      { type: "cs_fundamentals", title: "Core Computer Science", count: 8, durationMinutes: 20 },
    ],
    policySnapshot: getMockPolicy("cs_fundamentals", 20),
    whyRecommended: ["Validate depth in SQL joins and OS thread synchronization"],
    status: "published",
  },
  {
    id: "blueprint-behavioral-15",
    version: 1,
    name: "15 min Behavioral Mock",
    description: "Timed articulation of STAR stories under realistic follow-up and probe constraints.",
    mode: "behavioral",
    durationMinutes: 15,
    difficulty: "medium",
    sourceType: "platform",
    sectionsConfig: [
      { type: "behavioral", title: "STAR Leadership Evaluation", count: 3, durationMinutes: 15 },
    ],
    policySnapshot: getMockPolicy("behavioral", 15),
    whyRecommended: ["Practice executive communication without reading story notes"],
    status: "published",
  },
  {
    id: "blueprint-project-deepdive-30",
    version: 1,
    name: "30 min Project Deep Dive",
    description: "Architectural trade-offs, scalability, and debugging interrogation on your personal projects.",
    mode: "project_deep_dive",
    durationMinutes: 30,
    difficulty: "hard",
    sourceType: "platform",
    sectionsConfig: [
      { type: "project_deep_dive", title: "Architecture & Trade-offs", count: 4, durationMinutes: 30 },
    ],
    policySnapshot: getMockPolicy("project_deep_dive", 30),
    whyRecommended: ["Defend design choices and explain production failure recoveries"],
    status: "published",
  },
  {
    id: "blueprint-oa-simulator-60",
    version: 1,
    name: "60 min Online Assessment (OA)",
    description: "Strict timed assessment with sequential/free navigation, no pauses, and authoritative expiration.",
    mode: "oa",
    durationMinutes: 60,
    difficulty: "hard",
    sourceType: "platform",
    sectionsConfig: [
      { type: "coding", title: "Online Assessment Problems", count: 3, durationMinutes: 60 },
    ],
    policySnapshot: getOAPolicy(60),
    whyRecommended: ["Simulate strict company test environments with automatic deadline enforcement"],
    status: "published",
  },
]

export function getCanonicalBlueprintById(id: string): SessionBlueprint | undefined {
  return CANONICAL_BLUEPRINTS.find((b) => b.id === id)
}

export function getRecommendedBlueprintForContext(context: {
  targetCompany?: string | null
  targetRole?: string | null
  upcomingDays?: number | null
}): SessionBlueprint {
  // If upcoming interview with Amazon/FAANG within 10 days, prioritize Mixed Technical
  if (context.upcomingDays !== null && (context.upcomingDays ?? 99) <= 7) {
    return CANONICAL_BLUEPRINTS[0] // Amazon SDE Technical Mock
  }
  return CANONICAL_BLUEPRINTS[2] // 45 min Mixed Technical
}
