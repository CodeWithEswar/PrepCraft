"use client"
import { useEffect } from "react"
import { useQuery,useQueryClient } from "@tanstack/react-query"
import { loadMasteryAction } from "../server/actions"
import type { MasterySnapshot } from "../types/mastery.types"
export const masteryKey=(s:MasterySnapshot)=>["workspaces",s.workspace.id,"mastery",s.workspace.userId,s.policyVersion] as const
export function useMastery(initial:MasterySnapshot,days:MasterySnapshot["days"],preview:boolean){
 const cache=useQueryClient(),root=masteryKey(initial)
 const query=useQuery({queryKey:[...root,days],queryFn:async()=>{const result=await loadMasteryAction({slug:initial.workspace.slug,days});if(!result.success)throw new Error(result.error);return result.snapshot},initialData:days===initial.days?initial:undefined,enabled:!preview,staleTime:30000,refetchOnWindowFocus:true})
 useEffect(()=>{if(preview||typeof BroadcastChannel==="undefined")return;const channel=new BroadcastChannel(`revision:${initial.workspace.id}:${initial.workspace.userId}`);channel.onmessage=()=>void cache.invalidateQueries({queryKey:["workspaces",initial.workspace.id,"mastery",initial.workspace.userId]});return()=>channel.close()},[cache,initial.workspace.id,initial.workspace.userId,preview])
 return query
}
