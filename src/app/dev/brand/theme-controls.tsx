"use client"

import { useTheme } from "next-themes"

export function ThemeControls() {
  const { setTheme } = useTheme()
  return (
    <div className="brand-inspect-controls" aria-label="Preview theme">
      {["light", "dark", "system"].map(theme => <button type="button" key={theme} onClick={() => setTheme(theme)}>{theme === "system" ? "Auto" : theme === "light" ? "Light" : "Dark"}</button>)}
    </div>
  )
}
