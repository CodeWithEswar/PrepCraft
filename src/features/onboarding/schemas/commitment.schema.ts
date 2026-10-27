import { z } from "zod"

export const commitmentStepSchema = z.object({
  preset: z.enum(["light", "balanced", "focused", "intensive", "custom"], {
    message: "Please choose a commitment preset.",
  }),
  weeklyTargetMinutes: z.coerce
    .number()
    .int()
    .min(60, "Weekly commitment must be at least 1 hour (60 minutes).")
    .max(6000, "Weekly commitment cannot exceed 100 hours."),
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
    .min(1, "Please select at least one study day per week.")
    .max(7),
  defaultDailyMinutes: z.coerce
    .number()
    .int()
    .min(15, "Daily session must be at least 15 minutes.")
    .max(1440, "Daily session cannot exceed 24 hours."),
})

export type CommitmentStepValues = z.infer<typeof commitmentStepSchema>
