import { z } from "zod"

export const updateTargetSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  companyId: z.string().optional().nullable(),
  companyName: z.string().max(80).optional().nullable(),
  customCompanyName: z.string().max(80).optional().nullable(),
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
  customRoleName: z.string().max(80).optional().nullable(),
  preparationLevel: z.enum(["foundation", "developing", "interview_preparation"]),
  interviewLanguage: z.enum(["java", "python", "cpp", "javascript_typescript", "other"]),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format.")
    .optional()
    .nullable(),
})

export type UpdateTargetValues = z.infer<typeof updateTargetSchema>

export const updatePreferencesSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  weeklyTargetMinutes: z
    .coerce
    .number()
    .int()
    .min(60, "Weekly commitment must be at least 1 hour (60 minutes).")
    .max(3600, "Weekly commitment cannot exceed 60 hours."),
  defaultDailyMinutes: z
    .coerce
    .number()
    .int()
    .min(15, "Typical session must be at least 15 minutes.")
    .max(480, "Typical session cannot exceed 8 hours."),
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
    .min(1, "Select at least 1 active study day."),
  planningMode: z.enum(["balanced", "intense", "flexible"]).default("balanced"),
})

export type UpdatePreferencesValues = z.infer<typeof updatePreferencesSchema>
