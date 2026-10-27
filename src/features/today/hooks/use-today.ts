"use client"
import { useEffect, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { dayKeyAt } from "../services/day-context"
import { todayKeys } from "../services/query-keys"
import { loadTodayAction, mutateTodayAction } from "../server/mutations"
import type { TodayCommand, TodaySnapshot } from "../types/today.types"

export function useToday(initial:TodaySnapshot,preview:boolean) {
  const router=useRouter(),cache=useQueryClient()
  const [dayChanged,setDayChanged]=useState(false)
  const query=useQuery({queryKey:todayKeys.snapshot(initial.context.workspaceId,initial.dayKey),queryFn:()=>loadTodayAction(initial.context.slug),initialData:initial,initialDataUpdatedAt:Date.parse(initial.generatedAt),enabled:!preview,staleTime:30000})
  const mutation=useMutation({mutationFn:async(command:Omit<TodayCommand,"slug"|"dayKey">)=>{
    if(preview)throw new Error("Sign in to use your own Today plan.")
    const result=await mutateTodayAction({...command,slug:initial.context.slug,dayKey:initial.dayKey})
    if(!result.success)throw new Error(result.error)
    if(result.snapshot.context.workspaceId!==initial.context.workspaceId)throw new Error("Workspace changed. Refresh the page.")
    return result.snapshot
  },onSuccess:snapshot=>{cache.setQueryData(todayKeys.snapshot(snapshot.context.workspaceId,snapshot.dayKey),snapshot);if(snapshot.dayKey!==initial.dayKey)router.refresh()}})
  useEffect(()=>{
    if(preview)return
    const check=()=>{if(dayKeyAt(new Date(),initial.context.timezone)!==initial.dayKey){setDayChanged(true);router.refresh()}}
    const timer=setInterval(check,30000)
    document.addEventListener("visibilitychange",check)
    return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",check)}
  },[initial.context.timezone,initial.dayKey,preview,router])
  return {snapshot:query.data,mutation,error:mutation.error?.message||query.error?.message,refresh:()=>query.refetch(),dayChanged:dayChanged||query.data.dayKey!==initial.dayKey}
}
const mediaQuery="(max-width: 639px)"
function subscribe(callback:()=>void){const media=window.matchMedia(mediaQuery);media.addEventListener("change",callback);return()=>media.removeEventListener("change",callback)}
export function useTodayMobile(){return useSyncExternalStore(subscribe,()=>window.matchMedia(mediaQuery).matches,()=>false)}
