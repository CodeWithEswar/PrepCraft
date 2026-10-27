"use client"
import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { createExecutionAction } from "../server/mutations"
import { executionPolicy } from "../services/execution-policy"
import type { ExecutionLobby, ExecutionMode, ExecutionPrompt, ExecutionSnapshot } from "../types/execution.types"
import { ExecutionSelect } from "./execution-select"

const blankPrompt = (): ExecutionPrompt => ({
  title: "",
  body: "",
  topic: "",
  difficulty: "unspecified",
  constraints: "",
  examples: [],
  hints: []
})

export function ExecutionLobbyPage({
  lobby,
  initialMode = "practice",
  initialTopicId
}: {
  lobby: ExecutionLobby
  initialMode?: ExecutionMode
  initialTopicId?: string
}) {
  const initialTopic = lobby.topics?.find(topic => topic.id === initialTopicId)
  const router = useRouter()
  const [mode, setMode] = useState<ExecutionMode>(initialMode)
  const [minutes, setMinutes] = useState(lobby.task?.minutes || 30)
  const [untimed, setUntimed] = useState(false)
  const [prompts, setPrompts] = useState<ExecutionPrompt[]>([
    {
      ...blankPrompt(),
      title: lobby.task?.title || "",
      body: lobby.task?.notes || "",
      topicId: initialTopic?.id || null,
      topic: initialTopic?.name || ""
    }
  ])
  const [preflight, setPreflight] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [recovery, setRecovery] = useState<ExecutionSnapshot | null>(lobby.active)
  const request = useRef<{ payload: string; id: string } | null>(null)

  const policy = executionPolicy(mode)
  const base = `/w/${lobby.workspace.slug}`

  const start = async () => {
    if (busy || !confirmed || !lobby.canEdit) return
    setBusy(true)
    setError("")
    const values = {
      slug: lobby.workspace.slug,
      mode,
      targetSeconds: mode === "practice" && untimed ? null : minutes * 60,
      source: lobby.task ? ("task" as const) : ("manual" as const),
      taskId: lobby.task?.id,
      prompts
    }
    const payload = JSON.stringify(values)
    if (request.current?.payload !== payload) request.current = { payload, id: crypto.randomUUID() }

    try {
      const result = await createExecutionAction({ ...values, requestId: request.current.id })
      if (!result.success) {
        setError(result.error)
        if (result.snapshot) {
          setRecovery(result.snapshot)
          setPreflight(false)
        }
        return
      }
      router.push(`${base}/session/${result.snapshot.session.id}`)
    } catch {
      setError("The session could not be confirmed. Your setup has been kept.")
    } finally {
      setBusy(false)
    }
  }

  const update = (index: number, values: Partial<ExecutionPrompt>) =>
    setPrompts(current => current.map((prompt, i) => (i === index ? { ...prompt, ...values } : prompt)))

  return (
    <div className="pc-execution-lobby">
      <header className="pc-execution-lobby-header">
        <p className="pc-execution-eyebrow">
          <span className="pc-execution-eyebrow-dot" />
          <span>A clear space to begin</span>
        </p>
        <h1>Prepare with intent.</h1>
        <p>Choose your conditions. Focus on the work. Keep the useful evidence.</p>
      </header>

      {recovery && (
        <section className="pc-execution-recovery">
          <div className="pc-execution-recovery-icon">
            <AppIcon icon="clock" size={20} />
          </div>
          <div className="pc-execution-recovery-body">
            <h2>Your {recovery.session.mode} session is still {recovery.session.status}.</h2>
            <p>
              {recovery.items.find(item => item.id === recovery.session.currentItemId)?.title}. Reopening it preserves the original timer.
            </p>
          </div>
          <Button
            render={<Link href={`${base}/session/${recovery.session.id}`} />}
            nativeButton={false}
            size="sm"
            className="pc-execution-recovery-action"
          >
            <span>Continue session</span>
            <AppIcon icon="arrow-right" size={14} />
          </Button>
        </section>
      )}

      <div className="pc-execution-launch-grid">
        <section className="pc-execution-setup">
          <div className="pc-execution-section-title">
            <div>
              <h2>Start a focused session</h2>
              <span>{lobby.task ? "Pre-configured from Today task" : "Your question · your workspace"}</span>
            </div>
          </div>

          <div className="pc-execution-mode-picker" aria-label="Execution mode">
            {(["practice", "interview", "oa"] as const).map(value => {
              const isSelected = mode === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setMode(value)
                    if (value !== "practice") setUntimed(false)
                    if (value === "interview") setPrompts(current => current.slice(0, 1))
                  }}
                >
                  <div className="pc-execution-mode-icon">
                    <AppIcon
                      icon={value === "practice" ? "code" : value === "interview" ? "user" : "clock"}
                      size={18}
                    />
                  </div>
                  <strong>{value === "oa" ? "OA round" : value === "interview" ? "Interview practice" : "Practice"}</strong>
                  <span>
                    {value === "practice"
                      ? "Learn at your own pace"
                      : value === "interview"
                      ? "Reason, explain, implement"
                      : "One fixed round, multiple questions"}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="pc-execution-setup-fields">
            <div className="pc-execution-time-control">
              <Label htmlFor="pc-execution-minutes">Time target (minutes)</Label>
              <div className="pc-execution-time-input-wrap">
                <Input
                  id="pc-execution-minutes"
                  type="number"
                  min={1}
                  max={240}
                  disabled={mode === "practice" && untimed}
                  value={untimed ? "" : minutes}
                  onChange={event => setMinutes(Number(event.target.value))}
                />
                <span className="pc-execution-time-unit">min</span>
              </div>
            </div>
            {mode === "practice" && (
              <label className="pc-execution-check">
                <Checkbox checked={untimed} onCheckedChange={value => setUntimed(value === true)} />
                <span>Practice without a time target</span>
              </label>
            )}
          </div>

          <div className="pc-execution-questions-list">
            {prompts.map((prompt, index) => (
              <div className="pc-execution-prompt-form" key={index}>
                <div className="pc-execution-prompt-header">
                  <div className="pc-execution-prompt-indicator">
                    <span className="pc-execution-prompt-tag">Question {index + 1}</span>
                    {prompts.length > 1 && (
                      <span className="pc-execution-prompt-total">of {prompts.length}</span>
                    )}
                  </div>
                  {prompts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      aria-label={`Remove question ${index + 1}`}
                      onClick={() => setPrompts(current => current.filter((_, i) => i !== index))}
                      className="pc-execution-prompt-remove"
                    >
                      <AppIcon icon="close" size={13} />
                    </Button>
                  )}
                </div>

                <div className="pc-execution-field">
                  <Label htmlFor={`pc-title-${index}`}>Question title</Label>
                  <Input
                    id={`pc-title-${index}`}
                    value={prompt.title}
                    maxLength={160}
                    placeholder="e.g. Longest Substring Without Repeating Characters"
                    onChange={event => update(index, { title: event.target.value })}
                  />
                </div>

                <div className="pc-execution-field">
                  <Label htmlFor={`pc-body-${index}`}>Problem or preparation brief</Label>
                  <Textarea
                    id={`pc-body-${index}`}
                    rows={3}
                    maxLength={12000}
                    value={prompt.body}
                    placeholder="Add the problem statement or the work you want to explain. This is a session snapshot, not a public question."
                    onChange={event => update(index, { body: event.target.value })}
                  />
                </div>

                <div className="pc-execution-form-pair">
                  {Boolean(lobby.topics?.length) && (
                    <div className="pc-execution-field">
                      <Label>Curriculum topic</Label>
                      <ExecutionSelect
                        label={`Question ${index + 1} curriculum topic`}
                        value={prompt.topicId || "unmapped"}
                        onChange={value =>
                          update(index, {
                            topicId: value === "unmapped" ? null : value,
                            topic: lobby.topics?.find(topic => topic.id === value)?.name || prompt.topic
                          })
                        }
                        items={[
                          { value: "unmapped", label: "Not attributed" },
                          ...(lobby.topics || []).map(topic => ({ value: topic.id, label: topic.name }))
                        ]}
                      />
                    </div>
                  )}
                  <div className="pc-execution-field">
                    <Label htmlFor={`pc-topic-${index}`}>Topic label</Label>
                    <Input
                      id={`pc-topic-${index}`}
                      value={prompt.topic}
                      maxLength={120}
                      placeholder="e.g. Sliding Window"
                      onChange={event => update(index, { topic: event.target.value })}
                    />
                  </div>
                  <div className="pc-execution-field">
                    <Label>Difficulty</Label>
                    <ExecutionSelect
                      label={`Question ${index + 1} difficulty`}
                      value={prompt.difficulty}
                      onChange={value => update(index, { difficulty: value as ExecutionPrompt["difficulty"] })}
                      items={[
                        { value: "unspecified", label: "Not specified" },
                        { value: "easy", label: "Easy" },
                        { value: "medium", label: "Medium" },
                        { value: "hard", label: "Hard" }
                      ]}
                    />
                  </div>
                </div>

                <details className="pc-execution-hints-details">
                  <summary>
                    <AppIcon icon="chevron-right" size={13} />
                    <span>Constraints and optional structured hints</span>
                  </summary>
                  <div className="pc-execution-hints-body">
                    <div className="pc-execution-field">
                      <Label htmlFor={`pc-constraints-${index}`}>Constraints</Label>
                      <Textarea
                        id={`pc-constraints-${index}`}
                        rows={2}
                        maxLength={4000}
                        placeholder="e.g. 0 <= s.length <= 50,000"
                        value={prompt.constraints}
                        onChange={event => update(index, { constraints: event.target.value })}
                      />
                    </div>
                    {prompt.hints.map((hint, hintIndex) => (
                      <div className="pc-execution-field" key={hintIndex}>
                        <Label htmlFor={`pc-hint-${index}-${hintIndex}`}>{hint.title}</Label>
                        <Textarea
                          id={`pc-hint-${index}-${hintIndex}`}
                          rows={2}
                          maxLength={2000}
                          value={hint.body}
                          placeholder="Hint notes..."
                          onChange={event =>
                            update(index, {
                              hints: prompt.hints.map((item, i) =>
                                i === hintIndex ? { ...item, body: event.target.value } : item
                              )
                            })
                          }
                        />
                      </div>
                    ))}
                    {prompt.hints.length < 3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          update(index, {
                            hints: [...prompt.hints, { title: `Hint ${prompt.hints.length + 1}`, body: "" }]
                          })
                        }
                        className="pc-execution-add-hint-btn"
                      >
                        <AppIcon icon="plus" size={13} />
                        <span>Add a hint you already have</span>
                      </Button>
                    )}
                    <p className="pc-execution-hints-note">
                      Hints come from your supplied material. OA never reveals them.
                    </p>
                  </div>
                </details>
              </div>
            ))}
          </div>

          {policy.multipleQuestions && prompts.length < 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrompts(current => [...current, blankPrompt()])}
              className="pc-execution-add-question-btn"
            >
              <AppIcon icon="plus" size={14} />
              <span>Add question</span>
            </Button>
          )}

          <div className="pc-execution-launch-footer">
            <div className="pc-execution-policy-tip">
              <AppIcon icon="info" size={15} />
              <p>
                {policy.pause === "allowed"
                  ? "Pause when you need to. Your target is advisory."
                  : "The countdown continues through refreshes and tab changes."}
              </p>
            </div>
            <Button
              disabled={
                !lobby.canEdit ||
                !!recovery ||
                prompts.some(prompt => !prompt.title.trim()) ||
                (!untimed && (!minutes || minutes < 1 || minutes > 240))
              }
              onClick={() => {
                setPreflight(true)
                setConfirmed(false)
                setError("")
              }}
              className="pc-execution-launch-action"
            >
              <span>Review and begin</span>
              <AppIcon icon="arrow-right" size={15} />
            </Button>
          </div>
        </section>

        <aside className="pc-execution-history">
          <div className="pc-execution-history-card">
            <div className="pc-execution-section-title">
              <h2>Recent sessions</h2>
              {lobby.recent.length > 0 && (
                <span className="pc-execution-history-count">{lobby.recent.length}</span>
              )}
            </div>

            {lobby.recent.length ? (
              <ul className="pc-execution-history-list">
                {lobby.recent.map(session => (
                  <li key={session.id}>
                    <Link href={`${base}/session/${session.id}`} className="pc-execution-history-item">
                      <span className="pc-execution-history-icon">
                        <AppIcon icon={session.reflectionPending ? "file" : "clock"} size={16} />
                      </span>
                      <div className="pc-execution-history-meta">
                        <strong>{session.title}</strong>
                        <small>
                          {session.mode === "oa" ? "OA" : session.mode} ·{" "}
                          {session.reflectionPending ? "Reflection pending" : session.status}
                        </small>
                      </div>
                      <AppIcon icon="chevron-right" size={13} className="pc-execution-history-arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="pc-execution-history-empty">
                <div className="pc-execution-empty-icon">
                  <AppIcon icon="clock" size={20} />
                </div>
                <h3>Your first session starts here.</h3>
                <p>Recorded attempts and unfinished reflections will stay in this workspace.</p>
              </div>
            )}
          </div>

          <div className="pc-execution-policy-note">
            <div className="pc-execution-note-header">
              <AppIcon icon="shield" size={15} />
              <span>Session environment</span>
            </div>
            <ul className="pc-execution-note-list">
              <li>
                <span className="pc-execution-bullet">•</span>
                <span>Interview mode is structured self-practice. Outcomes and notes are self-reported.</span>
              </li>
              <li>
                <span className="pc-execution-bullet">•</span>
                <span>Code execution is not connected. Your notes are saved as session evidence.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <Dialog
        open={preflight}
        onOpenChange={open => {
          if (!busy) setPreflight(open)
        }}
      >
        <DialogContent className="pc-execution-preflight">
          <DialogHeader>
            <DialogTitle>
              {mode === "oa"
                ? "Ready for your OA round?"
                : mode === "interview"
                ? "Begin interview practice"
                : "Start practice session"}
            </DialogTitle>
            <DialogDescription>
              Review the conditions before the authoritative session begins.
            </DialogDescription>
          </DialogHeader>

          <div className="pc-execution-preflight-summary">
            <strong>
              {prompts[0].title}
              {prompts.length > 1 ? ` + ${prompts.length - 1} more` : ""}
            </strong>
            <dl>
              <div>
                <dt>Mode</dt>
                <dd>{mode === "oa" ? "OA round" : mode}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{mode === "practice" && untimed ? "Count up" : `${minutes} minutes`}</dd>
              </div>
              <div>
                <dt>Pause</dt>
                <dd>{policy.pause === "allowed" ? "Available" : "Unavailable"}</dd>
              </div>
              <div>
                <dt>Hints</dt>
                <dd>
                  {policy.hints === "forbidden"
                    ? "Not permitted"
                    : policy.hints === "limited"
                    ? "At most two"
                    : "Supplied hints"}
                </dd>
              </div>
            </dl>
          </div>

          <label className="pc-execution-check pc-execution-preflight-check">
            <Checkbox checked={confirmed} onCheckedChange={value => setConfirmed(value === true)} />
            <span>
              {policy.autoFinish
                ? "I understand the timer continues if I leave and the session ends at the deadline."
                : "I’m ready to begin. Pauses and hint use will be recorded."}
            </span>
          </label>

          {error && <p role="alert" className="pc-execution-preflight-error">{error}</p>}

          <Button disabled={!confirmed || busy} onClick={start} className="pc-execution-preflight-start">
            <span>
              {busy
                ? "Starting…"
                : mode === "oa"
                ? "Start OA"
                : mode === "interview"
                ? "Begin interview practice"
                : "Start practice"}
            </span>
            <AppIcon icon="play" size={15} />
          </Button>
        </DialogContent>
      </Dialog>

      {error && !preflight && (
        <p className="pc-execution-alert" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
