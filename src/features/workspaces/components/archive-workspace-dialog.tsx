"use client"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import type { MutationResult } from "../types/workspace.types"
import type { ArchiveWorkspaceValues } from "../schemas/workspace.schema"

interface ArchiveWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: {
    id: string
    name: string
  }
  onArchive: (values: ArchiveWorkspaceValues) => Promise<MutationResult>
  onSuccess?: () => void
}

export function ArchiveWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
  onArchive,
  onSuccess,
}: ArchiveWorkspaceDialogProps) {
  const [isPending, startTransition] = React.useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await onArchive({
        workspaceId: workspace.id,
        confirmName: workspace.name,
      })

      if (res.success) {
        toast.success(`Workspace "${workspace.name}" archived`, {
          description: "All preparation history and attempts remain preserved.",
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error("Failed to archive workspace", {
          description: res.error,
        })
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[440px] border-border/80 bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-lg font-semibold tracking-tight">
            Archive “{workspace.name}”?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Your preparation history, question attempts, revision records, analytics, and applications will remain fully preserved.
            <br />
            <br />
            You can restore this workspace at any time from workspace settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel disabled={isPending} className="text-xs">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isPending}
            className="bg-muted hover:bg-muted/80 text-foreground border border-border text-xs"
          >
            {isPending ? "Archiving..." : "Archive workspace"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
