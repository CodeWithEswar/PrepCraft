import { redirect } from "next/navigation"

export const instant = false

export default function SettingsIndexPage() {
  redirect("/settings/workspaces")
}
