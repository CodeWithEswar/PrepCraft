import { z } from "zod"

export const workspaceStepSchema = z.object({
  workspaceName: z
    .string()
    .min(2, "Workspace name must be at least 2 characters.")
    .max(60, "Workspace name cannot exceed 60 characters.")
    .trim(),
  templateId: z.string().min(1, "Please select a preparation template."),
})

export type WorkspaceStepValues = z.infer<typeof workspaceStepSchema>
