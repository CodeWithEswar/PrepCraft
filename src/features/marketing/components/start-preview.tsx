"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { AppIcon } from "@/components/app-icon"
import { MagneticIntent } from "../motion/magnetic-intent"

export function StartPreview({ label = "Start preparing", variant = "default", large = false }: { label?: string; variant?: "default" | "secondary" | "outline" | "ghost"; large?: boolean }) {
  const [completed, setCompleted] = useState<string[]>([])
  const tasks = ["Choose one pattern to practice", "Write down one mistake to revisit", "Set a revision date"]
  return <Dialog>
    <MagneticIntent><DialogTrigger render={<Button variant={variant} size={large ? "lg" : "default"} />}><span className="mk-intent-label">{label}</span><span className="mk-intent-icon"><AppIcon icon="arrow-right" size={16} /></span></DialogTrigger></MagneticIntent>
    <DialogContent className="mk-start-dialog">
      <DialogHeader><DialogTitle>A small plan. A clear next step.</DialogTitle><DialogDescription>Interactive product preview. Accounts and saved workspaces are coming in a later phase. These sample checkmarks last for this page visit.</DialogDescription></DialogHeader>
      <p className="mk-kicker">Try a preparation loop</p>
      <div className="mk-starter-tasks">{tasks.map(task => <label key={task}><Checkbox checked={completed.includes(task)} onCheckedChange={checked => setCompleted(current => checked ? [...current, task] : current.filter(t => t !== task))} /> <span>{task}</span></label>)}</div>
      <Progress value={completed.length / tasks.length * 100} aria-label="Sample preparation plan completion" />
      <p className="type-body-sm text-muted-foreground" aria-live="polite">{completed.length === 3 ? "A plan, a lesson, and a revisit. That’s a useful start." : `${completed.length} of 3 preparation steps explored.`}</p>
    </DialogContent>
  </Dialog>
}
