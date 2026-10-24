"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { PrepCraftLogo } from "@/components/brand"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { landingContent } from "../content/landing-content"
import { StartPreview } from "./start-preview"

const navItemMeta: Record<string, { icon: "book" | "code" | "star" | "folder" | "help" | "sparkles"; desc: string }> = {
  Product: { icon: "sparkles", desc: "Connected preparation system" },
  Workflow: { icon: "code", desc: "Plan, practice, reflect & revise" },
  Practice: { icon: "book", desc: "Pattern studio & deliberate attempts" },
  Progress: { icon: "star", desc: "Evidence-based readiness signals" },
  Interviews: { icon: "folder", desc: "Projects, trade-offs & behavioral prep" },
  FAQ: { icon: "help", desc: "Availability & preview details" },
}

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const sentinel = document.getElementById("page-top")
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting))
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <header className={`mk-header ${scrolled ? "mk-header-scrolled" : ""}`}>
      <div className="container-page mk-header-inner">
        <a href="#page-top" aria-label="PrepCraft home" className="mk-brand mk-brand-assembly">
          <PrepCraftLogo size={40} decorative />
        </a>
        <NavigationMenu className="mk-desktop-nav" aria-label="Main navigation">
          <NavigationMenuList>
            {landingContent.navigation.map(item => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink href={item.href}>{item.label}</NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="mk-header-actions">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Choose color theme" />}>
              <AppIcon icon="sun" size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["light", "dark", "system"] as const).map(t => (
                <DropdownMenuItem key={t} onClick={() => setTheme(t)}>
                  <AppIcon icon={t === "light" ? "sun" : t === "dark" ? "moon" : "system"} size={16} />
                  {t[0].toUpperCase() + t.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="mk-desktop-cta">
            <StartPreview label="Get started" />
          </div>
          <div className="mk-mobile-nav">
            <Drawer open={open} onOpenChange={setOpen} swipeDirection="down" showSwipeHandle={true}>
              <DrawerTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open navigation"
                    className="size-9 rounded-xl border-border/80 bg-surface/80 backdrop-blur-md hover:bg-surface-elevated active:scale-95 transition-all"
                  />
                }
              >
                <AppIcon icon="menu" size={18} />
              </DrawerTrigger>
              <DrawerContent className="max-h-[88dvh] rounded-t-[1.75rem] border-t border-border/80 bg-background/98 backdrop-blur-2xl shadow-2xl p-0 flex flex-col focus:outline-none">
                <DrawerHeader className="px-5 pt-1 pb-3 border-b border-border/40 flex flex-row items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    <PrepCraftLogo size={32} decorative />
                    <div className="flex flex-col">
                      <DrawerTitle className="text-sm font-semibold tracking-tight text-foreground">
                        PrepCraft
                      </DrawerTitle>
                      <DrawerDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                        Craft your way to ready.
                      </DrawerDescription>
                    </div>
                  </div>
                  <DrawerClose
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Close navigation"
                        className="size-8 rounded-full bg-surface-subtle hover:bg-surface-elevated text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                      />
                    }
                  >
                    <AppIcon icon="close" size={16} />
                  </DrawerClose>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="space-y-1.5">
                    <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground/80 px-1">
                      Navigation
                    </span>
                    <nav aria-label="Mobile navigation" className="space-y-1">
                      {landingContent.navigation.map(item => {
                        const meta = navItemMeta[item.label] ?? { icon: "arrow-right", desc: "Explore section" }
                        return (
                          <a
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            onClick={() => setOpen(false)}
                            className="group flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-border/60 bg-surface/40 hover:bg-surface-elevated active:bg-surface-subtle transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-8 rounded-lg border border-border/50 bg-surface-subtle flex items-center justify-center text-foreground group-hover:text-brand group-hover:border-brand/40 transition-colors shrink-0">
                                <AppIcon icon={meta.icon} size={16} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-foreground tracking-tight group-hover:text-brand transition-colors">
                                  {item.label}
                                </span>
                                <span className="text-[0.6875rem] text-muted-foreground truncate">
                                  {meta.desc}
                                </span>
                              </div>
                            </div>
                            <AppIcon
                              icon="chevron-right"
                              size={14}
                              className="text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                            />
                          </a>
                        )
                      })}
                    </nav>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground/80 px-1">
                      Core Topics
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["DSA", "Java", "SQL & DBMS", "OS", "Networks", "Projects", "Behavioral", "Timed Practice"].map(skill => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 text-[0.6875rem] rounded-lg border border-border/50 bg-surface-subtle/70 text-muted-foreground font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground/80">
                        Theme
                      </span>
                      <span className="text-[0.6875rem] text-muted-foreground capitalize">{theme ?? "system"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border/50">
                      {(["light", "dark", "system"] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTheme(mode)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${
                            theme === mode
                              ? "bg-surface-elevated text-foreground shadow-xs border border-border/70"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <AppIcon
                            icon={mode === "light" ? "sun" : mode === "dark" ? "moon" : "system"}
                            size={14}
                          />
                          <span className="capitalize">{mode}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 pb-3">
                    <div onClick={() => setOpen(false)}>
                      <StartPreview label="Explore the preview" />
                    </div>
                    <p className="text-[0.6875rem] text-center text-muted-foreground mt-2">
                      Sample workflow · No signup required
                    </p>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </header>
  )
}
