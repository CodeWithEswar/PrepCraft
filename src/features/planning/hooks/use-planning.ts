"use client"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { dayKeyAt, weekKeys } from "@/lib/time/workspace-calendar"
import { loadPlanningAction, mutatePlanningAction } from "../server/mutations"
import { planningKeys } from "../services/query-keys"
import { emptyPlanning } from "../services/planning-service"
import type { PlanningSnapshot, PlanningCommand } from "../types/planning.types"

export function usePlanning(initial:PlanningSnapshot,preview:boolean){
  const [week,setWeek]=useState(initial.week),[dayChanged,setDayChanged]=useState(false),cache=useQueryClient(),request=useRef<{key:string;id:string}|null>(null)
  const query=useQuery({queryKey:planningKeys.week(initial.context.workspaceId,week),queryFn:()=>loadPlanningAction(initial.context.slug,week),initialData:week===initial.week?initial:preview?emptyPlanning(initial.context,initial.generatedAt,week):undefined,initialDataUpdatedAt:Date.parse(initial.generatedAt),enabled:!preview,staleTime:30000})
  const snapshot=query.data||emptyPlanning(initial.context,initial.generatedAt,week)
  const mutation=useMutation({mutationFn:async(command:PlanningCommand)=>{
    if(preview)throw new Error("Sign in to save a preparation plan.")
    if(dayChanged)throw new Error("The workspace day changed. Reload Planning before saving.")
    const key=JSON.stringify({week,revision:snapshot.revision,command})
    if(request.current?.key!==key)request.current={key,id:crypto.randomUUID()}
    const result=await mutatePlanningAction({slug:snapshot.context.slug,week,revision:snapshot.revision,requestId:request.current.id,command})
    if(!result.success){if(result.conflict){request.current=null;await query.refetch()}throw new Error(result.error)}
    if(result.snapshot.context.workspaceId!==initial.context.workspaceId)throw new Error("Workspace changed. Reload Planning.")
    return result.snapshot
  },onSuccess:saved=>{request.current=null;cache.invalidateQueries({queryKey:planningKeys.all(saved.context.workspaceId),refetchType:"inactive"});cache.setQueryData(planningKeys.week(saved.context.workspaceId,saved.week),saved);cache.invalidateQueries({queryKey:["workspaces",saved.context.workspaceId,"today"]})}})
  useEffect(()=>{
    if(preview)return
    const check=()=>{if(dayKeyAt(new Date(),initial.context.timezone)!==initial.context.today)setDayChanged(true)}
    const timer=setInterval(check,30000);document.addEventListener("visibilitychange",check)
    return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",check)}
  },[initial.context.timezone,initial.context.today,preview])
  return {snapshot,week,setWeek,currentWeek:()=>setWeek(weekKeys(initial.context.today)[0]),mutation,refresh:()=>query.refetch(),loading:query.isPending,error:mutation.error?.message||query.error?.message,dayChanged}
}
function subscribe(callback:()=>void){const query=window.matchMedia("(max-width: 639px)");query.addEventListener("change",callback);return()=>query.removeEventListener("change",callback)}
export function usePlanningMobile(){return useSyncExternalStore(subscribe,()=>window.matchMedia("(max-width: 639px)").matches,()=>false)}
