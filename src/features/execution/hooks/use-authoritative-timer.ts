"use client"
import { useSyncExternalStore } from "react"
import { calibratedNow,deriveTimer } from "../services/timer-service"
import type { ExecutionSnapshot } from "../types/execution.types"
let performanceSample=0,timer:ReturnType<typeof setInterval>|null=null
const listeners=new Set<()=>void>()
function subscribe(listener:()=>void){
  listeners.add(listener)
  performanceSample=performance.now()
  if(!timer)timer=setInterval(()=>{performanceSample=performance.now();listeners.forEach(callback=>callback())},1000)
  return()=>{listeners.delete(listener);if(!listeners.size&&timer){clearInterval(timer);timer=null}}
}
const noSubscribe=()=>()=>{}
export function useAuthoritativeTimer(snapshot:ExecutionSnapshot,preview=false){
  const sample=useSyncExternalStore(preview?noSubscribe:subscribe,()=>performanceSample,()=>0)
  const now=snapshot.clock?calibratedNow(snapshot.serverNow,snapshot.clock.receivedAt,sample,snapshot.clock.roundTripMs):Date.parse(snapshot.serverNow)
  return {...deriveTimer(snapshot.session,now),ready:!!snapshot.clock||preview}
}
