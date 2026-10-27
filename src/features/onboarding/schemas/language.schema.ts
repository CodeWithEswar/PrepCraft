import { z } from "zod"

export const languageStepSchema = z.object({
  preferredCodingLanguage: z.enum(
    ["java", "python", "cpp", "javascript", "other"],
    { message: "Please select your primary interview language." }
  ),
})

export type LanguageStepValues = z.infer<typeof languageStepSchema>
