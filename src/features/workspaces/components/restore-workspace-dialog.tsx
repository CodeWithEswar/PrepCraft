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
import type { RestoreWorkspaceValues } from "../schemas/workspace.schema"

interface RestoreWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: {
    id: string
    name: string
  }
  onRestore: (values: RestoreWorkspaceValues) => Promise<MutationResult>
  onSuccess?: () => void
}

export function RestoreWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
  onRestore,
  onSuccess,
}: RestoreWorkspaceDialogProps) {
  const [isPending, startTransition] = React.useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await onRestore({
        workspaceId: workspace.id,
      })

      if (res.success) {
        toast.success(`Workspace "${workspace.name}" restored`, {
          description: "Active scheduling and dashboard access are now resumed.",
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error("Failed to restore workspace", {
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
            Restore “{workspace.name}”?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            This workspace will return to active status and appear in your regular workspace navigation.
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
          >
            {isPending ? "Restoring..." : "Restore workspace"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
