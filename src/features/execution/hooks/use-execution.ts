"use client"
import { useEffect,useRef,useSyncExternalStore } from "react"
import { useQuery,useQueryClient,useMutation } from "@tanstack/react-query"
import { executionKeys } from "../services/query-keys"
import { loadExecutionAction,mutateExecutionAction } from "../server/mutations"
import type { ExecutionSnapshot,ExecutionCommand } from "../types/execution.types"
export class ExecutionConflict extends Error {constructor(message:string){super(message);this.name="ExecutionConflict"}}
const subscribeOnline=(callback:()=>void)=>{window.addEventListener("online",callback);window.addEventListener("offline",callback);return()=>{window.removeEventListener("online",callback);window.removeEventListener("offline",callback)}}
export function useExecution(initial:ExecutionSnapshot,preview=false){
  const cache=useQueryClient(),key=executionKeys.session(initial.session.workspaceId,initial.session.userId,initial.session.id),request=useRef<{payload:string;id:string}|null>(null),channel=useRef<BroadcastChannel|null>(null)
  const online=useSyncExternalStore(subscribeOnline,()=>navigator.onLine,()=>true)
  const query=useQuery({queryKey:key,queryFn:async()=>{const before=performance.now(),result=await loadExecutionAction(initial.workspace.slug,initial.session.id);if(!result.success){const error=new Error(result.error);if(result.denied)error.name="PermissionDenied";throw error}return {...result.snapshot,clock:{receivedAt:performance.now(),roundTripMs:performance.now()-before}}},initialData:initial,initialDataUpdatedAt:0,enabled:!preview,retry:false,staleTime:10000,refetchInterval:30000,refetchOnWindowFocus:true,refetchOnReconnect:true})
  const mutation=useMutation({mutationFn:async(command:ExecutionCommand)=>{
    if(preview)throw new Error("Sign in to start a real preparation session.")
    if(!navigator.onLine)throw new Error("You are offline. The timer continues; this change has not been saved.")
    const current=cache.getQueryData<ExecutionSnapshot>(key)||query.data,payload=JSON.stringify({version:current.session.version,command})
    if(request.current?.payload!==payload)request.current={payload,id:crypto.randomUUID()}
    const before=performance.now(),result=await mutateExecutionAction({slug:current.workspace.slug,sessionId:current.session.id,version:current.session.version,requestId:request.current.id,command})
    if(!result.success){
      if(result.snapshot)cache.setQueryData(key,{...result.snapshot,clock:{receivedAt:performance.now(),roundTripMs:performance.now()-before}})
      if(result.conflict){request.current=null;await query.refetch();throw new ExecutionConflict(result.error)}
      throw new Error(result.error)
    }
    request.current=null
    return {...result.snapshot,clock:{receivedAt:performance.now(),roundTripMs:performance.now()-before}}
  },onSuccess:(saved,command)=>{
    cache.setQueryData(key,saved)
    channel.current?.postMessage({sessionId:saved.session.id,version:saved.session.version})
    if(["finish","debrief","pause","resume","abandon"].includes(command.kind)){cache.invalidateQueries({queryKey:["workspaces",saved.session.workspaceId,"today"]});cache.invalidateQueries({queryKey:["workspaces",saved.session.workspaceId,"planning"]});cache.invalidateQueries({queryKey:["workspaces",saved.session.workspaceId,"revision",saved.session.userId]});cache.invalidateQueries({queryKey:["workspaces",saved.session.workspaceId,"mastery",saved.session.userId]});if(command.kind==="debrief"&&typeof BroadcastChannel!=="undefined"){const revisionChannel=new BroadcastChannel(`revision:${saved.session.workspaceId}:${saved.session.userId}`);revisionChannel.postMessage("changed");revisionChannel.close()}}
  }})
  const refetch=query.refetch
  useEffect(()=>{
    if(preview)return
    const sync=()=>{if(document.visibilityState==="visible"&&navigator.onLine)void refetch()}
    const local="BroadcastChannel" in window?new BroadcastChannel(`pc-execution:${initial.session.workspaceId}:${initial.session.userId}`):null
    channel.current=local
    if(local)local.onmessage=event=>{if(event.data?.sessionId===initial.session.id)sync()}
    document.addEventListener("visibilitychange",sync)
    return()=>{document.removeEventListener("visibilitychange",sync);local?.close();channel.current=null}
  },[initial.session.id,initial.session.workspaceId,initial.session.userId,preview,refetch])
  return {snapshot:query.data,act:mutation.mutateAsync,perform:mutation.mutate,busy:mutation.isPending,online,error:mutation.error?.message||query.error?.message,accessDenied:query.error?.name==="PermissionDenied",refresh:query.refetch,restoring:!preview&&!query.data.clock}
}
