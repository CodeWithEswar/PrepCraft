"use client"
import type { ReactNode } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { usePlanningMobile } from "../hooks/use-planning"
export function PlanningPanel({open,onOpenChange,title,description,children}:{open:boolean;onOpenChange:(open:boolean)=>void;title:string;description:string;children:ReactNode}){
  const mobile=usePlanningMobile()
  return mobile?<Drawer open={open} onOpenChange={onOpenChange}><DrawerContent className="pc-planning-drawer"><DrawerHeader><DrawerTitle>{title}</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader><div className="pc-planning-panel-body">{children}</div></DrawerContent></Drawer>:<Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="pc-planning-sheet"><SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader><div className="pc-planning-panel-body">{children}</div></SheetContent></Sheet>
}
