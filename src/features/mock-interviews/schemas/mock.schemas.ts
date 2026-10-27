import { z } from "zod"

export const MockModeSchema = z.enum([
  "coding",
  "cs_fundamentals",
  "behavioral",
  "project_deep_dive",
  "mixed",
  "oa",
  "custom",
])

export const MockSectionTypeSchema = z.enum([
  "coding",
  "dsa",
  "cs_fundamentals",
  "aptitude",
  "java",
  "sql_dbms",
  "operating_systems",
  "networks",
  "behavioral",
  "project_deep_dive",
  "custom_question",
])

export const MockDifficultySchema = z.enum(["easy", "medium", "hard", "mixed"])

export const SimulationPolicySchema = z.object({
  mode: MockModeSchema,
  totalDurationSeconds: z.number().nullable(),
  pausePolicy: z.enum(["allowed", "restricted", "forbidden"]),
  navigationPolicy: z.enum(["free", "sequential", "locked"]),
  hintPolicy: z.enum(["allowed", "limited", "forbidden"]),
  answerChangePolicy: z.enum(["allowed", "restricted"]),
  autoSubmit: z.boolean(),
  questionTimerPolicy: z.enum(["none", "target", "hard_limit"]),
  showProgress: z.boolean(),
  showQuestionStatus: z.boolean(),
  allowFlagging: z.boolean(),
  allowScratchpad: z.boolean(),
  allowCodeExecution: z.boolean(),
  reviewPolicyVersion: z.string().default("mock-evaluation-v1"),
})

export const MockSectionConfigSchema = z.object({
  type: MockSectionTypeSchema,
  title: z.string().min(1).max(120),
  count: z.number().int().min(1).max(20),
  durationMinutes: z.number().int().min(1).max(180),
})

export const LaunchMockSessionSchema = z.object({
  workspaceSlug: z.string().min(1),
  blueprintId: z.string().optional(),
  customConfig: z
    .object({
      title: z.string().min(1).max(120),
      mode: MockModeSchema,
      durationMinutes: z.number().int().min(10).max(240),
      difficulty: MockDifficultySchema,
      sections: z.array(MockSectionConfigSchema).min(1).max(10),
      pausePolicy: z.enum(["allowed", "restricted", "forbidden"]).default("forbidden"),
      navigationPolicy: z.enum(["free", "sequential", "locked"]).default("free"),
      hints: z.boolean().default(false),
      scratchpad: z.boolean().default(true),
      autoSubmit: z.boolean().default(true),
    })
    .optional(),
  idempotencyKey: z.string().min(1),
})

export const SaveMockAnswerSchema = z.object({
  workspaceSlug: z.string().min(1),
  sessionId: z.string().uuid(),
  itemId: z.string().uuid(),
  code: z.string().max(100000).optional(),
  language: z.string().max(32).optional(),
  scratchpad: z.string().max(50000).optional(),
  answer: z.string().max(50000).optional(),
  userConfidence: z.number().min(1).max(5).optional(),
})

export const FlagMockItemSchema = z.object({
  workspaceSlug: z.string().min(1),
  sessionId: z.string().uuid(),
  itemId: z.string().uuid(),
  flagged: z.boolean(),
})

export const SubmitMockSessionSchema = z.object({
  workspaceSlug: z.string().min(1),
  sessionId: z.string().uuid(),
  reason: z.enum(["user_finished", "time_expired", "abandoned"]).default("user_finished"),
})

export const ApplyNextWeekBridgeSchema = z.object({
  workspaceSlug: z.string().min(1),
  selectedItemIds: z.array(z.string()).min(1),
})
