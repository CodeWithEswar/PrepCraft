"use client"
import { useState } from "react"
import { AppIcon, type AppIconName } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TASK_LABELS } from "../utils/today-display"
import { taskTypes } from "../schemas/today.schema"
import { shiftDay } from "../services/day-context"
import type { TodayCommand, TodayTask } from "../types/today.types"

type SaveCommand = (command: Omit<TodayCommand, "slug" | "dayKey">) => Promise<unknown>

function TaskPanel({
  open,
  onOpenChange,
  title,
  description,
  badgeText = "Today's Plan",
  badgeIcon = "target",
  children
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  badgeText?: string
  badgeIcon?: AppIconName
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pc-today-dialog">
        <div className="pc-today-sheet-handle" aria-hidden="true" />
        <DialogHeader className="pc-today-dialog-header">
          <div className="pc-today-dialog-badge">
            <AppIcon icon={badgeIcon} size={13} />
            <span>{badgeText}</span>
          </div>
          <DialogTitle className="pc-today-dialog-title">{title}</DialogTitle>
          <DialogDescription className="pc-today-dialog-desc">{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function AddTodayTask({
  open,
  onOpenChange,
  save,
  pending
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  save: SaveCommand
  pending: boolean
}) {
  const [taskId, setTaskId] = useState(() => crypto.randomUUID())
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [type, setType] = useState<TodayTask["type"]>("custom")
  const [minutes, setMinutes] = useState("30")
  const [required, setRequired] = useState(true)
  const [error, setError] = useState("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    try {
      await save({
        kind: "add",
        taskId,
        title: title.trim(),
        notes: notes.trim(),
        type,
        minutes: Number(minutes),
        required
      })
      onOpenChange(false)
      setTaskId(crypto.randomUUID())
      setTitle("")
      setNotes("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Task could not be saved.")
    }
  }

  return (
    <TaskPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Make room for one clear task."
      description="Add preparation you intend to do today. Estimates stay separate from recorded focus time."
      badgeText="Add Task"
      badgeIcon="plus"
    >
      <form className="pc-today-task-form" onSubmit={handleSubmit}>
        <div className="pc-form-group">
          <label htmlFor="today-task-title" className="pc-form-label">
            <span>Task</span>
            <span className="pc-form-label-required">*</span>
          </label>
          <Input
            id="today-task-title"
            required
            maxLength={160}
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Review SQL joins"
            className="pc-today-input"
          />
        </div>

        <div className="pc-today-form-pair">
          <div className="pc-form-group">
            <label id="today-task-category-label" className="pc-form-label">
              <span>Preparation area</span>
            </label>
            <Select
              value={type}
              onValueChange={(value) => {
                if (value) setType(value as TodayTask["type"])
              }}
              items={taskTypes.map((value) => ({ value, label: TASK_LABELS[value] }))}
            >
              <SelectTrigger
                aria-labelledby="today-task-category-label"
                className="w-full pc-today-select-trigger"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="pc-today-select-content">
                {taskTypes.map((itemType) => (
                  <SelectItem key={itemType} value={itemType}>
                    {TASK_LABELS[itemType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pc-form-group">
            <label id="today-task-duration-label" className="pc-form-label">
              <span>Estimated time</span>
            </label>
            <Select
              value={minutes}
              onValueChange={(value) => {
                if (value) setMinutes(value)
              }}
              items={[15, 20, 25, 30, 35, 45, 60, 90].map((m) => ({
                value: String(m),
                label: `${m} minutes`
              }))}
            >
              <SelectTrigger
                aria-labelledby="today-task-duration-label"
                className="w-full pc-today-select-trigger"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="pc-today-select-content">
                {[15, 20, 25, 30, 35, 45, 60, 90].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Accordion className="pc-today-accordion">
          <AccordionItem value="notes" className="pc-today-accordion-item">
            <AccordionTrigger className="pc-today-accordion-trigger">
              <span className="pc-today-accordion-header">
                <AppIcon icon="file" size={14} className="text-brand shrink-0" />
                <span>Notes (optional)</span>
                <span className={`pc-today-accordion-pill ${notes.trim() ? "is-active" : ""}`}>
                  {notes.trim() ? "Note added" : "Optional"}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pc-today-accordion-content">
              <div className="pc-today-notes-box">
                <Textarea
                  id="today-task-notes"
                  maxLength={1000}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What does a useful finish look like?"
                  className="pc-today-textarea"
                />
                <div className="pc-today-notes-meta">
                  <span>Keep notes concise and actionable.</span>
                  <span>{notes.length}/1000</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <label htmlFor="today-task-required" className="pc-today-required-card">
          <Checkbox
            id="today-task-required"
            checked={required}
            onCheckedChange={(checked) => setRequired(checked === true)}
          />
          <div className="pc-today-required-copy">
            <strong>Part of today’s required plan</strong>
            <span>Counts toward today&apos;s daily completion target and focus commitment.</span>
          </div>
        </label>

        {error && (
          <p role="alert" className="pc-today-form-error">
            <AppIcon icon="alert-circle" size={14} />
            <span>{error}</span>
          </p>
        )}

        <div className="pc-today-dialog-footer">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="pc-today-cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={pending || !title.trim()}
            className="pc-today-submit-button"
          >
            {pending ? (
              <>
                <AppIcon icon="spinner" className="animate-spin" size={15} />
                <span>Saving task…</span>
              </>
            ) : (
              <>
                <span>Add task</span>
                <AppIcon icon="plus" size={15} />
              </>
            )}
          </Button>
        </div>
      </form>
    </TaskPanel>
  )
}

export function RescheduleTodayTask({
  task,
  dayKey,
  onClose,
  save,
  pending
}: {
  task: TodayTask | null
  dayKey: string
  onClose: () => void
  save: SaveCommand
  pending: boolean
}) {
  const [date, setDate] = useState(shiftDay(dayKey, 1))
  const [error, setError] = useState("")

  return (
    <TaskPanel
      open={!!task}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Give this task a better time."
      description="Moving a task changes its plan placement. Any source revision deadline stays unchanged."
      badgeText="Reschedule"
      badgeIcon="calendar"
    >
      <form
        className="pc-today-task-form"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!task) return
          setError("")
          try {
            await save({
              kind: "defer",
              taskId: task.id,
              version: task.version,
              destination: date
            })
            onClose()
          } catch (err) {
            setError(err instanceof Error ? err.message : "The task could not be moved.")
          }
        }}
      >
        <div className="pc-today-reschedule-preview">
          <div className="pc-today-reschedule-icon">
            <AppIcon icon="target" size={16} />
          </div>
          <div>
            <strong>{task?.title}</strong>
            <small>
              {task?.estimatedMinutes} min · {task?.type ? TASK_LABELS[task.type] : "Preparation"}
            </small>
          </div>
        </div>

        <div className="pc-form-group">
          <label htmlFor="today-task-date" className="pc-form-label">
            <span>Move to</span>
          </label>
          <Input
            id="today-task-date"
            type="date"
            min={task?.dayKey === dayKey ? shiftDay(dayKey, 1) : dayKey}
            max={shiftDay(dayKey, 365)}
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pc-today-input"
          />
        </div>

        {error && (
          <p role="alert" className="pc-today-form-error">
            <AppIcon icon="alert-circle" size={14} />
            <span>{error}</span>
          </p>
        )}

        <div className="pc-today-dialog-footer">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={pending}
            className="pc-today-cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="pc-today-submit-button"
          >
            {pending ? (
              <>
                <AppIcon icon="spinner" className="animate-spin" size={15} />
                <span>Moving…</span>
              </>
            ) : (
              <>
                <span>Reschedule task</span>
                <AppIcon icon="calendar" size={15} />
              </>
            )}
          </Button>
        </div>
      </form>
    </TaskPanel>
  )
}
