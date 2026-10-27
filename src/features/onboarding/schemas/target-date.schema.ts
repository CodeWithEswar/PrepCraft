import { z } from "zod"

export const targetDateStepSchema = z
  .object({
    hasTargetDate: z.boolean(),
    targetDate: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.hasTargetDate) {
      if (!data.targetDate || data.targetDate.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please choose your preparation target date.",
          path: ["targetDate"],
        })
        return
      }

      const parsed = new Date(data.targetDate)
      if (isNaN(parsed.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid date.",
          path: ["targetDate"],
        })
        return
      }

      // Ensure target date is not in the past (compare with today in local timezone)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (parsed < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Target date must be today or in the future.",
          path: ["targetDate"],
        })
      }
    }
  })

export type TargetDateStepValues = z.infer<typeof targetDateStepSchema>
