"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface ComposerSettings {
  durationMinutes: number
  difficulty: "easy" | "medium" | "hard" | "mixed"
  pausePolicy: "allowed" | "restricted" | "forbidden"
  navigationPolicy: "free" | "sequential" | "locked"
  hints: boolean
  scratchpad: boolean
  autoSubmit: boolean
}

interface SettingsConfiguratorProps {
  settings: ComposerSettings
  onChange: (updated: ComposerSettings) => void
  onStartFromTemplate?: () => void
}

export function SettingsConfigurator({
  settings,
  onChange,
  onStartFromTemplate,
}: SettingsConfiguratorProps) {
  return (
    <div className="pc-composer-step-block">
      <div className="flex items-center justify-between">
        <div className="pc-step-label">
          <span className="pc-step-number">2</span>
          <span>Configure Settings</span>
        </div>
        {onStartFromTemplate && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={onStartFromTemplate}
          >
            Start from Template
          </Button>
        )}
      </div>

      <div className="pc-composer-settings-grid">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Total Duration</Label>
          <Select
            value={String(settings.durationMinutes)}
            onValueChange={(val) => {
              if (val) onChange({ ...settings, durationMinutes: parseInt(val, 10) })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="55">55 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Difficulty</Label>
          <Select
            value={settings.difficulty}
            onValueChange={(val) => {
              if (val) onChange({ ...settings, difficulty: val as ComposerSettings["difficulty"] })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="mixed">Medium → Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Pause Policy</Label>
          <Select
            value={settings.pausePolicy}
            onValueChange={(val) => {
              if (val) onChange({ ...settings, pausePolicy: val as ComposerSettings["pausePolicy"] })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Pause" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forbidden">No Pause (OA style)</SelectItem>
              <SelectItem value="restricted">Restricted Pause</SelectItem>
              <SelectItem value="allowed">Pause Allowed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Navigation</Label>
          <Select
            value={settings.navigationPolicy}
            onValueChange={(val) => {
              if (val) onChange({ ...settings, navigationPolicy: val as ComposerSettings["navigationPolicy"] })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Navigation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="sequential">Sequential</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pc-composer-switches">
        <div className="pc-switch-row">
          <div className="flex flex-col">
            <span className="font-semibold text-xs">Hints</span>
            <span className="text-[11px] text-muted-foreground">
              Allow hints during the session
            </span>
          </div>
          <Switch
            checked={settings.hints}
            onCheckedChange={(checked) => onChange({ ...settings, hints: checked })}
          />
        </div>

        <div className="pc-switch-row">
          <div className="flex flex-col">
            <span className="font-semibold text-xs">Scratchpad</span>
            <span className="text-[11px] text-muted-foreground">
              Enable personal notes
            </span>
          </div>
          <Switch
            checked={settings.scratchpad}
            onCheckedChange={(checked) =>
              onChange({ ...settings, scratchpad: checked })
            }
          />
        </div>

        <div className="pc-switch-row">
          <div className="flex flex-col">
            <span className="font-semibold text-xs">Auto Submit</span>
            <span className="text-[11px] text-muted-foreground">
              Automatically submit on time expiry
            </span>
          </div>
          <Switch
            checked={settings.autoSubmit}
            onCheckedChange={(checked) =>
              onChange({ ...settings, autoSubmit: checked })
            }
          />
        </div>
      </div>
    </div>
  )
}
