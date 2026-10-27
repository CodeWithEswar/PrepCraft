"use client"
import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { PrepCraftLogo } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export function AuthHeader() {
  const { setTheme } = useTheme()

  return (
    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
      <Link
        href="/"
        aria-label="PrepCraft Home"
        className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        <PrepCraftLogo size={36} appearance="auto" />
      </Link>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="glass"
                size="icon-md"
                aria-label="Toggle color theme"
                className="size-8.5 rounded-xl border border-border/70 bg-surface/70 backdrop-blur-md shadow-xs hover:bg-surface-elevated/90 hover:border-border text-foreground transition-all"
              />
            }
          >
            <AppIcon icon="sun" size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["light", "dark", "system"] as const).map((t) => (
              <DropdownMenuItem key={t} onClick={() => setTheme(t)}>
                <AppIcon
                  icon={t === "light" ? "sun" : t === "dark" ? "moon" : "system"}
                  size={14}
                  className="mr-2"
                />
                {t[0].toUpperCase() + t.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="glass"
          size="icon-md"
          aria-label="Back to home"
          title="Back to home"
          nativeButton={false}
          className="size-8.5 rounded-xl border border-border/70 bg-surface/70 backdrop-blur-md shadow-xs hover:bg-surface-elevated/90 hover:border-border text-foreground transition-all"
          render={
            <Link href="/" aria-label="Back to home" />
          }
        >
          <AppIcon icon="arrow-left" size={16} />
        </Button>
      </div>
    </header>
  )
}
