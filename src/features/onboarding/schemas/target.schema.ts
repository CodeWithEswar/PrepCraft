import { z } from "zod"

export const targetStepSchema = z.object({
  roleFamily: z.enum(
    [
      "Software Engineer",
      "Frontend Engineer",
      "Backend Engineer",
      "Full-Stack Engineer",
      "Mobile Engineer",
      "Data / ML Engineer",
      "Other",
    ],
    { message: "Please select a target role family." }
  ),
  roleName: z
    .string()
    .min(1, "Please enter your target role title.")
    .max(80, "Role title must be 80 characters or less.")
    .trim(),
  companySelection: z.string().default("none"),
  customCompanyName: z
    .string()
    .max(80, "Company name must be 80 characters or less.")
    .trim()
    .optional()
    .or(z.literal("")),
})

export type TargetStepValues = z.infer<typeof targetStepSchema>
