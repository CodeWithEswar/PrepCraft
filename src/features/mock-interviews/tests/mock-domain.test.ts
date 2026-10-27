import { describe, expect, it } from "vitest"
import { getMockPolicy } from "../policies/mock-policy-v1"
import { getOAPolicy } from "../policies/oa-policy-v1"
import { CANONICAL_BLUEPRINTS, getCanonicalBlueprintById } from "../services/blueprint-service"
import { buildMockSession } from "../services/session-builder"
import { selectQuestionsForSection } from "../services/question-selector"
import { normalizeSessionEvidence } from "../services/evidence-normalizer"
import { evaluateSessionFacets } from "../policies/evaluation-policy-v1"
import { generateMockReview } from "../services/evaluation-service"
import { buildPlanningProposalFromBridge } from "../services/planning-bridge"

describe("Mock Interview & OA Simulation Engine", () => {
  describe("Simulation Policies", () => {
    it("enforces strict OA policy constraints", () => {
      const oaPolicy = getOAPolicy(60)
      expect(oaPolicy.mode).toBe("oa")
      expect(oaPolicy.totalDurationSeconds).toBe(3600)
      expect(oaPolicy.pausePolicy).toBe("forbidden")
      expect(oaPolicy.hintPolicy).toBe("forbidden")
      expect(oaPolicy.autoSubmit).toBe(true)
      expect(oaPolicy.questionTimerPolicy).toBe("hard_limit")
    })

    it("configures standard coding mock policy", () => {
      const codingPolicy = getMockPolicy("coding", 30)
      expect(codingPolicy.mode).toBe("coding")
      expect(codingPolicy.totalDurationSeconds).toBe(1800)
      expect(codingPolicy.allowCodeExecution).toBe(true)
      expect(codingPolicy.allowScratchpad).toBe(true)
      expect(codingPolicy.hintPolicy).toBe("limited")
    })
  })

  describe("Canonical Blueprints", () => {
    it("contains all 7 canonical platform blueprints", () => {
      expect(CANONICAL_BLUEPRINTS.length).toBeGreaterThanOrEqual(7)
      const amazon = getCanonicalBlueprintById("blueprint-amazon-sde-mixed")
      expect(amazon).toBeDefined()
      expect(amazon?.durationMinutes).toBe(60)
      expect(amazon?.sectionsConfig.length).toBe(3)

      const oa = getCanonicalBlueprintById("blueprint-oa-simulator-60")
      expect(oa).toBeDefined()
      expect(oa?.policySnapshot.pausePolicy).toBe("forbidden")
    })
  })

  describe("Question Selection & Session Building", () => {
    it("selects questions deterministically for sections", () => {
      const items = selectQuestionsForSection(
        { type: "coding", title: "DSA", count: 2, durationMinutes: 30 },
        "test-sec-1",
        0
      )
      expect(items.length).toBe(2)
      expect(items[0].sourceType).toBe("question")
      expect(items[0].difficultySnapshot).toBeDefined()
      expect(items[0].targetDurationSeconds).toBe(900)
    })

    it("builds a session with frozen policy snapshot and authoritative expiration", () => {
      const blueprint = getCanonicalBlueprintById("blueprint-amazon-sde-mixed")!
      const session = buildMockSession({
        workspaceId: "ws-1",
        userId: "user-1",
        blueprint,
      })

      expect(session.status).toBe("active")
      expect(session.policySnapshot.mode).toBe("mixed")
      expect(session.expiresAt).toBeDefined()
      expect(Date.parse(session.expiresAt!) - Date.parse(session.startedAt)).toBe(
        60 * 60 * 1000
      )
      expect(session.sections.length).toBe(3)
    })
  })

  describe("Critical Trust Principle & Evaluation", () => {
    it("NEVER fabricates communication evaluation when speech was not recorded", () => {
      const blueprint = getCanonicalBlueprintById("blueprint-amazon-sde-mixed")!
      const session = buildMockSession({
        workspaceId: "ws-1",
        userId: "user-1",
        blueprint,
      })

      const review = generateMockReview(session, new Date().toISOString(), null)

      // Communication must be "not_evaluated", NOT a fake percentage
      expect(review.facets.communication.status).toBe("not_evaluated")
      expect(review.facets.communication.provenance).toBe("rule_derived")
      expect(review.facets.communication.notEvaluatedReason).toContain(
        "PrepCraft simulates conditions without pretending to hear speech"
      )

      // Evidence gaps must record this explicitly
      const commGap = review.evidenceGaps.find((g) => g.dimension === "communication")
      expect(commGap).toBeDefined()
    })

    it("evaluates testing dimension based on actual captured edge cases", () => {
      const evidence = {
        mode: "coding",
        totalQuestions: 2,
        completedQuestions: 2,
        partialQuestions: 0,
        unansweredQuestions: 0,
        totalDurationSeconds: 1800,
        actualDurationSeconds: 1600,
        codingQuestions: [
          {
            title: "Two Sum",
            actualSeconds: 800,
            targetSeconds: 900,
            runCount: 3,
            submissionCount: 2,
            firstRunSeconds: 300,
            passed: true,
            usedHints: 0,
            customTestsRun: false,
            failedEdgeCasesBeforePass: 1, // deferred edge case!
          },
        ],
        objectiveQuestions: [],
        subjectiveQuestions: [],
      }

      const facets = evaluateSessionFacets(evidence)
      expect(facets.testing.status).toBe("needs_attention")
      expect(facets.testing.provenance).toBe("observed")
    })
  })

  describe("Planning Bridge", () => {
    it("converts recommendations to Planning proposals without auto-scheduling", () => {
      const proposal = buildPlanningProposalFromBridge([
        {
          id: "1",
          title: "Graph Traversal",
          detail: "2 unseen Medium questions",
          estimatedMinutes: 40,
          topic: "Graph Traversal",
          selected: true,
        },
      ])

      expect(proposal.length).toBe(1)
      expect(proposal[0].title).toBe("Graph Traversal")
      expect(proposal[0].taskType).toBe("dsa_practice")
      expect(proposal[0].estimatedMinutes).toBe(40)
      expect(proposal[0].source).toBe("mock_interview_bridge")
    })
  })
})
