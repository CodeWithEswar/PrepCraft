"use client"
import { useCallback,useEffect,useMemo,useSyncExternalStore } from "react"
import type { ExecutionItem,ExecutionCommand,ExecutionSnapshot } from "../types/execution.types"
import { ExecutionConflict } from "./use-execution"
export type WorkingDraft=Pick<ExecutionItem,"code"|"language"|"scratchpad"|"answer">
interface DraftState {data:WorkingDraft;saved:WorkingDraft;dirty:boolean;conflict:boolean;error:string;saving:boolean}
const states=new Map<string,DraftState>(),listeners=new Map<string,Set<()=>void>>()
function notify(key:string){listeners.get(key)?.forEach(listener=>listener())}
function publish(key:string,state:DraftState){states.set(key,state);try{if(state.dirty)localStorage.setItem(key,JSON.stringify({data:state.data,saved:state.saved,at:Date.now()}));else localStorage.removeItem(key)}catch{/* Device storage can be unavailable; the in-memory draft remains. */}notify(key)}
function validDraft(value:unknown):value is WorkingDraft {if(!value||typeof value!=="object")return false;const row=value as WorkingDraft;return typeof row.code==="string"&&row.code.length<=64000&&typeof row.scratchpad==="string"&&row.scratchpad.length<=12000&&typeof row.answer==="string"&&row.answer.length<=12000&&["typescript","javascript","java","python","cpp","text"].includes(row.language)}
export function useWorkingDraft(snapshot:ExecutionSnapshot,item:ExecutionItem,save:(command:ExecutionCommand)=>Promise<unknown>,canSave:boolean,busy:boolean,preview:boolean){
  const key=`pc-execution-draft:${snapshot.session.userId}:${snapshot.workspace.id}:${snapshot.session.id}:${item.id}`
  const server=useMemo<WorkingDraft>(()=>({code:item.code,language:item.language,scratchpad:item.scratchpad,answer:item.answer}),[item.code,item.language,item.scratchpad,item.answer])
  const initial=useMemo<DraftState>(()=>({data:server,saved:server,dirty:false,conflict:false,error:"",saving:false}),[server])
  const subscribe=useCallback((callback:()=>void)=>{
    if(!states.has(key)){
      let state=initial
      if(!preview)try{const value=JSON.parse(localStorage.getItem(key)||"null");if(value&&validDraft(value.data)&&validDraft(value.saved)&&Date.now()-value.at<7*86400000)state={...initial,data:value.data,saved:value.saved,dirty:true,conflict:JSON.stringify(value.saved)!==JSON.stringify(initial.saved)}}catch{/* An invalid device draft is ignored. */}
      states.set(key,state)
    }
    if(!listeners.has(key))listeners.set(key,new Set());listeners.get(key)!.add(callback)
    return()=>{listeners.get(key)?.delete(callback)}
  },[key,initial,preview])
  const state=useSyncExternalStore(subscribe,()=>states.get(key)||initial,()=>initial)
  useEffect(()=>{
    const current=states.get(key);if(!current)return
    if(JSON.stringify(server)!==JSON.stringify(current.saved))publish(key,current.dirty?{...current,conflict:true,error:"A different draft was saved in another tab. Review both versions before saving."}:{...initial})
  },[server,key,initial])
  const update=(changes:Partial<WorkingDraft>)=>{const current=states.get(key)||initial;publish(key,{...current,data:{...current.data,...changes},dirty:true,error:""})}
  const persist=useCallback(async(force=false)=>{
    const current=states.get(key)||initial
    if(!current.dirty||current.saving||(!force&&current.conflict)||!canSave)return
    const sent=current.data;publish(key,{...current,saving:true,error:"",conflict:false})
    try{await save({kind:"draft",itemId:item.id,...sent});const latest=states.get(key)!;publish(key,{...latest,saved:sent,dirty:JSON.stringify(latest.data)!==JSON.stringify(sent),saving:false,conflict:false,error:""})}
    catch(error){const latest=states.get(key)!;publish(key,{...latest,saving:false,conflict:error instanceof ExecutionConflict,error:error instanceof Error?error.message:"This draft has not been saved."});if(force)throw error}
  },[key,initial,item.id,canSave,save])
  useEffect(()=>{if(!state.dirty||state.saving||state.conflict||state.error||!canSave||busy||preview)return;const timer=setTimeout(()=>void persist(),1200);return()=>clearTimeout(timer)},[state.dirty,state.data,state.saving,state.conflict,state.error,canSave,busy,preview,persist])
  const discard=()=>publish(key,{...initial})
  return {state,update,persist,discard}
}
