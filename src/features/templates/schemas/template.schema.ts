import { z } from "zod"

export const templateTypeSchema = z.enum([
  "general",
  "company",
  "role",
  "company_role",
  "custom",
])

export const templateStatusSchema = z.enum([
  "draft",
  "review",
  "published",
  "deprecated",
  "archived",
])

export const templateVisibilitySchema = z.enum([
  "public",
  "internal",
  "private",
])

export const curriculumPrioritySchema = z.enum([
  "core",
  "high",
  "medium",
  "low",
  "optional",
])

export const stageTypeSchema = z.enum([
  "oa",
  "coding",
  "technical",
  "behavioral",
  "project",
  "system_design",
  "managerial",
  "other",
])

export const readinessDimensionSchema = z.enum([
  "dsa",
  "programming_language",
  "cs_fundamentals",
  "projects",
  "behavioral",
  "timed_practice",
])

export const applyTemplateSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  templateId: z.string().min(1, "Template identifier is required"),
  versionNumber: z.number().int().positive().optional(),
})

export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>

export const upgradeTemplateSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  templateId: z.string().min(1, "Template identifier is required"),
  newVersionNumber: z.number().int().positive("New version number must be positive"),
})

export type UpgradeTemplateInput = z.infer<typeof upgradeTemplateSchema>

export const curriculumOverrideSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  entityType: z.enum(["track", "topic", "pattern"]),
  entityId: z.string().min(1, "Entity ID is required"),
  overrideType: z.enum(["priority", "weight", "inclusion"]),
  value: z.record(z.string(), z.unknown()),
})

export type CurriculumOverrideInput = z.infer<typeof curriculumOverrideSchema>

export const templateFilterSchema = z.object({
  search: z.string().optional(),
  category: z.enum(["all", "recommended", "company", "role", "general"]).default("all"),
  companyId: z.string().optional(),
  roleFamilyId: z.string().optional(),
})

export type TemplateFilterInput = z.infer<typeof templateFilterSchema>
