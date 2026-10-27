"use client"

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { AppIcon } from "@/components/app-icon"
import { PrepCraftLogo, PrepCraftSymbol } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import type { AppShellProps } from "./shell.types"

export function AppShell({children,navigation,dashboardHref,settingsHref,workspaceName,userName="You",workspaceControl,notificationControl,profileAction,preview=false,archived=false}: AppShellProps) {
  const pathname=usePathname()
  const isActiveHref=(href:string)=>pathname===href||(href!==dashboardHref&&pathname.startsWith(`${href}/`))
  const todaySurface=pathname==="/preview"||pathname==="/preview/plan"||/^\/w\/[^/]+\/(today|plan)\/?$/.test(pathname)
  const {theme,resolvedTheme,setTheme}=useTheme()
  const mounted=useSyncExternalStore(()=>()=>{},()=>true,()=>false)
  const [collapsed,setCollapsed]=useState(false)
  const [mobileOpen,setMobileOpen]=useState(false)
  const [searchOpen,setSearchOpen]=useState(false)
  const [search,setSearch]=useState("")
  const [closedGroups,setClosedGroups]=useState<string[]>([])
  const menuId=useId()
  const contentRef=useRef<HTMLElement>(null)
  const searchResults=[{label:"Dashboard",href:dashboardHref,icon:"dashboard" as const},...navigation.flatMap(group=>group.items)].filter(item=>item.label.toLowerCase().includes(search.toLowerCase()))


  useEffect(()=>{
    const shortcut=(event:KeyboardEvent)=>{
      if(event.defaultPrevented)return
      if ((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k") {event.preventDefault();setSearchOpen(open=>!open)}
      if ((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="b") {event.preventDefault();setCollapsed(value=>!value)}
    }
    window.addEventListener("keydown",shortcut)
    return ()=>window.removeEventListener("keydown",shortcut)
  },[])

  const activeTheme=mounted?(resolvedTheme||theme):"light"
  const themeIcon=activeTheme==="dark"?"moon":"sun"
  useEffect(()=>{
    window.scrollTo(0,0)
    contentRef.current?.scrollTo({top:0,behavior:"instant"})
  },[pathname])

  useEffect(()=>{
    const lockWindowScroll=()=>{
      if(window.scrollY!==0||window.scrollX!==0){
        window.scrollTo(0,0)
      }
    }
    window.addEventListener("scroll",lockWindowScroll,{passive:true})
    lockWindowScroll()
    return ()=>window.removeEventListener("scroll",lockWindowScroll)
  },[])

  function renderNavigation(mobile=false) {
    const compact=collapsed&&!mobile
    return <>
      <div className="pc-shell-brand"><Link href={dashboardHref} aria-label="PrepCraft dashboard">{compact?<PrepCraftSymbol size={26} decorative/>:<PrepCraftLogo appearance="dark" size={31} decorative/>}</Link>{!mobile&&<button className="pc-shell-collapse" aria-label={collapsed?"Expand sidebar":"Collapse sidebar"} onClick={()=>setCollapsed(value=>!value)}><AppIcon icon={collapsed?"sidebar-open":"sidebar-close"} size={17}/></button>}</div>
      {workspaceControl&&!compact&&<div className="pc-shell-workspace-control">{workspaceControl}</div>}
      <nav aria-label={mobile?"Mobile workspace navigation":"Workspace navigation"} className="pc-shell-navigation">
        <Link href={dashboardHref} title={compact?"Dashboard":undefined} className={`pc-shell-nav-link ${pathname===dashboardHref?"is-active":""}`} aria-current={pathname===dashboardHref?"page":undefined} onClick={()=>setMobileOpen(false)}><AppIcon icon="calendar" size={18}/><span>Today</span><AppIcon icon="chevron-right" size={13}/></Link>
        {navigation.map((group,index)=>{
          const open=!closedGroups.includes(group.label)
          return <div className="pc-shell-nav-group" key={group.label}>
            {group.items.length===1?<Link href={group.items[0].href} title={compact?group.label:undefined} className={`pc-shell-nav-link ${isActiveHref(group.items[0].href)?"is-active":""}`} aria-current={isActiveHref(group.items[0].href)?"page":undefined} onClick={()=>setMobileOpen(false)}><AppIcon icon={group.icon} size={18}/><span>{group.label}</span></Link>:<>
              <button className="pc-shell-group-toggle" title={compact?group.label:undefined} aria-expanded={open} aria-controls={`${menuId}-${mobile?"mobile":"desktop"}-${index}`} onClick={()=>{if(compact){setCollapsed(false);setClosedGroups(current=>current.filter(label=>label!==group.label));return}setClosedGroups(current=>open?current.concat(group.label):current.filter(label=>label!==group.label))}}><AppIcon icon={group.icon} size={18}/><span>{group.label}</span><AppIcon icon={open?"chevron-down":"chevron-right"} size={12}/></button>
              <div id={`${menuId}-${mobile?"mobile":"desktop"}-${index}`} className="pc-shell-nav-children" hidden={!open||compact}>{group.items.map(item=><Link key={`${item.href}-${item.label}`} href={item.href} className={`pc-shell-nav-link ${isActiveHref(item.href)?"is-active":""}`} aria-current={isActiveHref(item.href)?"page":undefined} onClick={()=>setMobileOpen(false)}><AppIcon icon={item.icon} size={15}/><span>{item.label}</span></Link>)}</div>
            </>}
          </div>
        })}
      </nav>
      <div className="pc-shell-sidebar-footer"><Link href={settingsHref} className="pc-shell-nav-link" title={compact?"Settings":undefined}><AppIcon icon="settings" size={18}/><span>Settings</span></Link><div className="pc-shell-encouragement"><span><AppIcon icon="flame" size={20}/></span><div><strong>Keep going.</strong><small>Small steps. Lasting progress.</small></div><AppIcon icon="chevron-right" size={14}/></div><Link href="/" className="pc-shell-back-link"><AppIcon icon="arrow-left" size={12}/><span>Back to PrepCraft</span></Link></div>
    </>
  }

  return <div className="pc-shell" data-ready={mounted} data-collapsed={collapsed} data-surface={todaySurface?"today":undefined}>
    <a href="#workspace-content" className="pc-shell-skip" onClick={e=>{e.preventDefault();contentRef.current?.focus({preventScroll:true});contentRef.current?.scrollTo({top:0,behavior:"smooth"})}}>Skip to workspace content</a>
    <aside className="pc-shell-sidebar dark">{renderNavigation()}</aside>
    <div className="pc-shell-frame">
      <header className="pc-shell-topbar">
        <button disabled={!mounted} className="pc-shell-mobile-trigger pc-shell-icon-button" aria-label="Open workspace navigation" onClick={()=>setMobileOpen(true)}><AppIcon icon="menu" size={21}/></button>
        <Link className="pc-shell-mobile-brand" href={dashboardHref} aria-label="PrepCraft dashboard"><PrepCraftSymbol size={27} decorative/></Link>
        <button className="pc-shell-search" aria-label="Search pages, topics and tools… ⌘ K" onClick={()=>setSearchOpen(true)}><AppIcon icon="search" size={17}/><span>Search pages, topics and tools…</span><kbd>⌘ K</kbd></button>
        <div className="pc-shell-topbar-actions">
          {preview&&<span className="pc-shell-preview-badge">Sample workspace</span>}
          <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Workspace color theme" className="pc-shell-action-btn"/>}><AppIcon icon={themeIcon} size={18}/></DropdownMenuTrigger><DropdownMenuContent align="end">{(["light","dark","system"] as const).map(theme=><DropdownMenuItem key={theme} onClick={()=>setTheme(theme)}><AppIcon icon={theme==="light"?"sun":theme==="dark"?"moon":"system"} size={16}/>{theme[0].toUpperCase()+theme.slice(1)}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
<div className="pc-shell-notification-control">{notificationControl||<Button variant="ghost" size="icon" disabled aria-label="Notifications unavailable"><AppIcon icon="bell" size={18}/></Button>}</div>
          <DropdownMenu><DropdownMenuTrigger render={<button className="pc-shell-profile"/>}><span className="pc-shell-avatar" aria-hidden="true">{userName.trim().charAt(0).toUpperCase()||"P"}</span><span><strong>{userName}</strong><small>{workspaceName}</small></span><span className="sr-only">Open account menu</span><AppIcon icon="chevron-down" size={13}/></DropdownMenuTrigger><DropdownMenuContent align="end" className="pc-shell-profile-dropdown"><div className="pc-profile-menu-header"><div className="pc-profile-menu-user"><span className="pc-profile-menu-avatar" aria-hidden="true">{userName.trim().charAt(0).toUpperCase()||"P"}</span><div className="pc-profile-menu-details"><span className="pc-profile-menu-name">{userName}</span><span className="pc-profile-menu-badge">Workspace Member</span></div></div><div className="pc-profile-menu-workspace-chip"><AppIcon icon="building" size={13} className="shrink-0 text-muted-foreground"/><span>{workspaceName}</span></div></div><DropdownMenuSeparator/><DropdownMenuItem render={<Link href={settingsHref}/>}><AppIcon icon="settings" size={15}/><span>Workspace settings</span></DropdownMenuItem><DropdownMenuItem render={<Link href={preview?"/login":"/settings/workspaces"}/>}><AppIcon icon="folder" size={15}/><span>{preview?"Sign in to your workspace":"Manage workspaces"}</span></DropdownMenuItem>{profileAction&&<><DropdownMenuSeparator/>{profileAction}</>}</DropdownMenuContent></DropdownMenu>
        </div>
      </header>
      {archived&&<div className="pc-shell-archive-notice"><AppIcon icon="info" size={15}/>Archived workspace · your preparation is available to review.</div>}
      <main id="workspace-content" tabIndex={-1} ref={contentRef} className="pc-shell-content">{children}</main>
      <footer className="pc-shell-status"><span><i/>{preview?"Interactive design preview · sample data":"Your preparation, connected"}</span><span>Craft your way to ready.</span></footer>
    </div>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" className="pc-shell-mobile dark"><SheetHeader className="sr-only"><SheetTitle>Workspace navigation</SheetTitle><SheetDescription>Explore your preparation workspace.</SheetDescription></SheetHeader>{renderNavigation(true)}</SheetContent></Sheet>
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}><DialogContent className="pc-shell-command"><DialogHeader><DialogTitle>Find your next step</DialogTitle><DialogDescription>Search workspace pages and preparation tools.</DialogDescription></DialogHeader><label className="pc-shell-command-input"><AppIcon icon="search" size={18}/><input aria-label="Search workspace pages" placeholder="Where would you like to go?" value={search} onChange={event=>setSearch(event.target.value)}/></label><div className="pc-shell-search-results">{searchResults.length?searchResults.map(item=><Link href={item.href} key={`${item.href}-${item.label}`} onClick={()=>{setSearchOpen(false);setSearch("");setMobileOpen(false)}}><AppIcon icon={item.icon} size={18}/><span>{item.label}</span><AppIcon icon="arrow-right" size={14}/></Link>):<p>No matching pages. Try “practice” or “planner”.</p>}</div><small>Navigate with Tab · Open with Enter · Close with Escape</small></DialogContent></Dialog>
  </div>
}
