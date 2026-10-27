import { z } from "zod"

export const profileStepSchema = z.object({
  displayName: z
    .string()
    .min(1, "Please enter your display name.")
    .max(60, "Display name must be 60 characters or less.")
    .trim(),
  collegeName: z
    .string()
    .max(120, "College name must be 120 characters or less.")
    .trim()
    .optional()
    .or(z.literal("")),
  graduationYear: z
    .union([
      z.coerce
        .number()
        .int("Graduation year must be a whole number.")
        .min(1980, "Year must be 1980 or later.")
        .max(2100, "Year must be 2100 or earlier."),
      z.literal(""),
      z.nan(),
    ])
    .optional()
    .nullable()
    .transform((val) => (typeof val === "number" && !isNaN(val) ? val : null)),
})

export type ProfileStepValues = z.infer<typeof profileStepSchema>
