"use client"
import { useSyncExternalStore } from "react"
import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from "@/components/ui/select"
const subscribeHydration=()=>()=>{}
export function AnalyticsSelect({label,value,items,onChange,disabled=false}:{label:string;value:string;items:{value:string;label:string}[];onChange:(value:string)=>void;disabled?:boolean}){const ready=useSyncExternalStore(subscribeHydration,()=>true,()=>false);return <Select value={value} disabled={disabled||!ready} onValueChange={v=>{if(v!==null)onChange(String(v))}}><SelectTrigger className="pc-an-select" aria-label={label}><SelectValue>{items.find(i=>i.value===value)?.label||label}</SelectValue></SelectTrigger><SelectContent>{items.map(i=><SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent></Select>}
