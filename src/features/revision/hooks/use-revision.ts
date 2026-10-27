"use client"
import { useEffect } from "react"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { queryKeys } from "@/lib/query/keys"
import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query"
import { loadRevisionQueue,loadRevisionDetail,mutateRevisionAction } from "../server/mutations"
import type { RevisionSnapshot,RevisionFilters,RevisionCursor,RevisionItem,RevisionCommand,RevisionDetail } from "../types/revision.types"
export const revisionKey=(s:RevisionSnapshot)=>queryKeys.personal(s.workspace.id,s.workspace.userId,"revision")
export function useRevision(initial:RevisionSnapshot,filters:RevisionFilters,cursor:RevisionCursor|null,preview:boolean){
 const cache=useQueryClient(),root=revisionKey(initial)
 const search=useDebouncedValue(filters.search),effectiveFilters={...filters,search:preview?filters.search:search}
 const query=useQuery({queryKey:[...root,"queue",effectiveFilters,cursor],queryFn:async()=>{const result=await loadRevisionQueue({slug:initial.workspace.slug,filters:effectiveFilters,cursor});if(!result.success)throw new Error(result.error);return result.snapshot},initialData:!cursor&&effectiveFilters.search===""&&filters.state==="all"&&filters.outcome==="all"&&filters.difficulty==="all"&&filters.topic===""?initial:undefined,enabled:!preview,refetchInterval:60000,refetchOnWindowFocus:true})
 const mutation=useMutation({mutationFn:async({item,command,requestId}:{item:RevisionItem;command:RevisionCommand;requestId:string})=>{const result=await mutateRevisionAction({slug:initial.workspace.slug,itemId:item.id,version:item.version,command,requestId});if(!result.success)throw new Error(result.error);return result.payload},onSuccess:async()=>{await Promise.all([cache.invalidateQueries({queryKey:root}),cache.invalidateQueries({queryKey:["workspaces",initial.workspace.id,"today"]}),cache.invalidateQueries({queryKey:["workspaces",initial.workspace.id,"planning"]})]);if(typeof BroadcastChannel!=="undefined"){const channel=new BroadcastChannel(`revision:${initial.workspace.id}:${initial.workspace.userId}`);channel.postMessage("changed");channel.close()}},onError:()=>{void cache.invalidateQueries({queryKey:root})}})
 useEffect(()=>{if(preview||typeof BroadcastChannel==="undefined")return;const channel=new BroadcastChannel(`revision:${initial.workspace.id}:${initial.workspace.userId}`);channel.onmessage=()=>void cache.invalidateQueries({queryKey:["workspaces",initial.workspace.id,"revision",initial.workspace.userId]});return()=>channel.close()},[cache,initial.workspace.id,initial.workspace.userId,preview])
 return {query,mutation,snapshot:query.data||initial}
}
export function useRevisionDetail(slug:string,id:string,scope:readonly unknown[],previewDetail?:RevisionDetail){return useQuery({queryKey:[...scope,"detail",id],queryFn:async()=>{const r=await loadRevisionDetail(slug,id);if(!r.success)throw new Error(r.error);return r.detail},initialData:previewDetail,enabled:!previewDetail,staleTime:0})}
