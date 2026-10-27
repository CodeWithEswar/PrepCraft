import { CANONICAL_BLUEPRINTS } from "../services/blueprint-service"
import { buildMockSession } from "../services/session-builder"
import { generateMockReview } from "../services/evaluation-service"
import type { MockHomeData, MockReview, MockSession } from "../types/mock.types"

export function getMockPreviewHomeData(): MockHomeData {
  return {
    workspace: {
      id: "preview-workspace-amazon",
      slug: "general-sde-preparation",
      name: "Amazon SDE",
      timezone: "Asia/Calcutta",
      targetRole: "Software Development Engineer",
      targetCompany: "Amazon",
      interviewDate: "2024-10-28T09:00:00.000Z",
    },
    recommendedBlueprint: CANONICAL_BLUEPRINTS[0], // Amazon SDE Technical Mock (60 min)
    blueprints: CANONICAL_BLUEPRINTS,
    recentSessions: [
      {
        id: "sess-recent-1",
        mode: "coding",
        title: "Coding Mock (DSA Medium)",
        dateFormatted: "5 days ago",
        durationMinutes: 30,
        solvedRatioText: "3/4 solved",
        primaryFindingText: "Edge-case validation under pressure",
        hasReview: true,
      },
      {
        id: "sess-recent-2",
        mode: "cs_fundamentals",
        title: "CS Fundamentals (Java, OS, Networks)",
        dateFormatted: "9 days ago",
        durationMinutes: 20,
        solvedRatioText: "7/10 correct",
        primaryFindingText: "OS synchronization refresh",
        hasReview: true,
      },
      {
        id: "sess-recent-3",
        mode: "behavioral",
        title: "Behavioral Mock (Leadership Principles)",
        dateFormatted: "12 days ago",
        durationMinutes: 15,
        solvedRatioText: "Practiced 4 prompts",
        primaryFindingText: "Strong structure, succinct closing",
        hasReview: true,
      },
      {
        id: "sess-recent-4",
        mode: "mixed",
        title: "Mixed Technical (Coding + CS + Project)",
        dateFormatted: "15 days ago",
        durationMinutes: 60,
        solvedRatioText: "5/7 completed",
        primaryFindingText: "Testing under pressure",
        hasReview: true,
      },
    ],
    readiness: {
      overallPercentage: 78,
      dimensions: [
        { name: "Problem Solving", percentage: 72 },
        { name: "CS Fundamentals", percentage: 68 },
        { name: "Behavioral", percentage: 85 },
        { name: "Project Discussion", percentage: 62 },
        { name: "Time Management", percentage: 74 },
      ],
    },
    upcomingInterview: {
      company: "Amazon",
      role: "SDE",
      type: "Technical + Behavioral",
      dateFormatted: "Oct 28, 2024",
      daysRemaining: 6,
    },
    performanceInsights: [
      {
        id: "insight-time",
        title: "Time Management",
        status: "needs_attention",
        statusText: "Needs Work",
        description: "You often spend >40% of time on early questions.",
      },
      {
        id: "insight-testing",
        title: "Testing",
        status: "developing",
        statusText: "Developing",
        description: "Edge cases are frequently missed before submission.",
      },
      {
        id: "insight-system-design",
        title: "System Design Thinking",
        status: "no_recent_evidence",
        statusText: "No Recent Evidence",
        description: "Try a project deep dive or system design mock.",
      },
      {
        id: "insight-behavioral",
        title: "Behavioral Confidence",
        status: "strong",
        statusText: "Strong",
        description: "Clear structure and good examples in recent practice.",
      },
    ],
    nextWeekBridge: {
      totalEstimatedMinutes: 120,
      sourceNote: "Recommended follow-up based on this and recent mocks.",
      items: [
        {
          id: "item-bridge-1",
          title: "Graph Traversal Practice",
          detail: "2 unseen Medium questions",
          estimatedMinutes: 40,
          topic: "Graph Traversal",
          selected: true,
        },
        {
          id: "item-bridge-2",
          title: "Operating Systems",
          detail: "Synchronization + 5 questions",
          estimatedMinutes: 30,
          topic: "Operating Systems",
          selected: true,
        },
        {
          id: "item-bridge-3",
          title: "Project Deep Dive",
          detail: "Practice architecture explanation",
          estimatedMinutes: 20,
          topic: "System Architecture",
          selected: false,
        },
        {
          id: "item-bridge-4",
          title: "Behavioral",
          detail: "Answer 3 high-priority prompts",
          estimatedMinutes: 30,
          topic: "Leadership Principles",
          selected: false,
        },
      ],
    },
  }
}

export function getMockPreviewSession(): MockSession {
  return buildMockSession({
    workspaceId: "preview-workspace-amazon",
    userId: "preview-user",
    blueprint: CANONICAL_BLUEPRINTS[0],
  })
}

export function getMockPreviewReview(): MockReview {
  const session = getMockPreviewSession()
  return generateMockReview(session, new Date().toISOString(), null)
}
