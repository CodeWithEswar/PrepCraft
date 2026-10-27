import { z } from "zod"

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters.")
    .max(60, "Workspace name cannot exceed 60 characters.")
    .trim(),
  roleFamily: z.enum([
    "Software Engineer",
    "Backend Engineer",
    "Frontend Engineer",
    "Full-Stack Engineer",
    "Mobile Engineer",
    "Data / ML Engineer",
  ]),
  roleName: z
    .string()
    .min(2, "Role title must be at least 2 characters.")
    .max(80, "Role title cannot exceed 80 characters.")
    .trim(),
  companyName: z.string().max(80).optional().nullable(),
  companyId: z.string().optional().nullable(),
  customCompanyName: z.string().max(80).optional().nullable(),
  interviewLanguage: z
    .enum(["java", "python", "cpp", "javascript_typescript", "other"])
    .default("java"),
  preparationLevel: z
    .enum(["foundation", "developing", "interview_preparation"])
    .default("developing"),
  weeklyTargetMinutes: z
    .coerce
    .number()
    .int()
    .min(60, "Target must be at least 1 hour (60 minutes).")
    .max(3600, "Target cannot exceed 60 hours per week.")
    .default(600),
  defaultDailyMinutes: z
    .coerce
    .number()
    .int()
    .min(15, "Session must be at least 15 minutes.")
    .max(480, "Session cannot exceed 8 hours.")
    .default(120),
  studyDays: z
    .array(
      z.enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ])
    )
    .min(1, "Select at least 1 study day.")
    .default(["monday", "tuesday", "wednesday", "thursday", "friday"]),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format.")
    .optional()
    .nullable(),
  templateId: z.string().default("amazon-sde"),
  timezone: z.string().default("UTC"),
})

export type CreateWorkspaceValues = z.infer<typeof createWorkspaceSchema>

export const renameWorkspaceSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters.")
    .max(60, "Workspace name cannot exceed 60 characters.")
    .trim(),
  timezone: z.string().min(2, "Valid IANA timezone required.").default("UTC"),
})

export type RenameWorkspaceValues = z.infer<typeof renameWorkspaceSchema>

export const archiveWorkspaceSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  confirmName: z.string().min(1, "Please confirm the workspace name."),
})

export type ArchiveWorkspaceValues = z.infer<typeof archiveWorkspaceSchema>

export const restoreWorkspaceSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
})

export type RestoreWorkspaceValues = z.infer<typeof restoreWorkspaceSchema>
