"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"
import {
  createWorkspaceSchema,
  type CreateWorkspaceValues,
} from "../schemas/workspace.schema"
import type { MutationResult } from "../types/workspace.types"

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAction?: (values: CreateWorkspaceValues) => Promise<MutationResult<{ workspaceId: string; slug: string }>>
  onCreate?: (values: CreateWorkspaceValues) => Promise<MutationResult<{ workspaceId: string; slug: string }>>
}

const DAYS_OF_WEEK = [
  { id: "monday", label: "M" },
  { id: "tuesday", label: "T" },
  { id: "wednesday", label: "W" },
  { id: "thursday", label: "T" },
  { id: "friday", label: "F" },
  { id: "saturday", label: "S" },
  { id: "sunday", label: "S" },
]

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onCreateAction,
  onCreate,
}: CreateWorkspaceDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)
  const createFn = onCreateAction || onCreate

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      roleFamily: "Software Engineer",
      roleName: "Software Engineer",
      companyName: "Amazon",
      interviewLanguage: "java",
      preparationLevel: "developing",
      weeklyTargetMinutes: 600,
      defaultDailyMinutes: 120,
      studyDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      templateId: "amazon-sde",
      timezone: "UTC",
    },
  })

  const weeklyTarget = watch("weeklyTargetMinutes") || 600

  const onSubmit = (values: CreateWorkspaceValues) => {
    if (!createFn) return
    setServerError(null)
    startTransition(async () => {
      const res = await createFn(values)
      if (res.success && res.data) {
        toast.success(`Workspace "${values.name}" created!`)
        onOpenChange(false)
        reset()
        router.push(res.nextUrl || `/w/${res.data.slug}/today`)
      } else if (!res.success) {
        setServerError(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-border/80 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Create Workspace</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Set up an isolated preparation context for a specific target company, role, or interview date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Workspace Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ws-name" className="text-xs font-medium">Workspace Name</Label>
            <Input
              id="ws-name"
              placeholder="e.g. Amazon SDE I, Google L4, General Prep"
              {...register("name")}
              className="text-xs sm:text-sm"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target Company */}
            <div className="space-y-1.5">
              <Label htmlFor="ws-company" className="text-xs font-medium">Target Company</Label>
              <Input
                id="ws-company"
                placeholder="e.g. Amazon, Google, TCS"
                {...register("companyName")}
                className="text-xs"
              />
            </div>

            {/* Target Role */}
            <div className="space-y-1.5">
              <Label htmlFor="ws-role" className="text-xs font-medium">Target Role Title</Label>
              <Input
                id="ws-role"
                placeholder="e.g. Software Engineer"
                {...register("roleName")}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Coding Language */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Coding Language</Label>
              <select
                {...register("interviewLanguage")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="javascript_typescript">JavaScript / TypeScript</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Preparation Level */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Preparation Stage</Label>
              <select
                {...register("preparationLevel")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="foundation">Foundation (Core concepts)</option>
                <option value="developing">Developing (Consistent practice)</option>
                <option value="interview_preparation">Interview Preparation (Mock/timed)</option>
              </select>
            </div>
          </div>

          {/* Study Days & Target Hours */}
          <div className="space-y-2 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Active Study Days</Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {(weeklyTarget / 60).toFixed(0)} hrs/week
              </span>
            </div>
            <Controller
              control={control}
              name="studyDays"
              render={({ field }) => (
                <ToggleGroup
                  value={field.value}
                  onValueChange={(val) => {
                    if (val.length > 0) field.onChange(val)
                  }}
                  className="justify-between w-full"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <ToggleGroupItem
                      key={d.id}
                      value={d.id}
                      className="h-8 w-8 text-xs font-medium p-0"
                    >
                      {d.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            />
          </div>

          {serverError && (
            <p className="text-xs text-destructive font-medium text-center">{serverError}</p>
          )}

          <DialogFooter className="mt-4 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Creating..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
