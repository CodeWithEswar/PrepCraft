"use client"
import { useCallback,useSyncExternalStore } from "react"
/** External-store snapshot keeps SSR deterministic and synchronizes same-device tabs. */
export function useLocalDraft(key:string|null):[string|null,(value:string|null)=>void]{
 const subscribe=useCallback((cb:()=>void)=>{const handler=(event:Event)=>{if(event instanceof StorageEvent&&event.key!==key)return;cb()};window.addEventListener("storage",handler);window.addEventListener("pc-learning-draft",handler);return()=>{window.removeEventListener("storage",handler);window.removeEventListener("pc-learning-draft",handler)}},[key])
 const get=useCallback(()=>{if(!key)return null;try{return localStorage.getItem(key)}catch{return null}},[key]),value=useSyncExternalStore(subscribe,get,()=>null)
 const set=useCallback((value:string|null)=>{if(!key)return;try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);window.dispatchEvent(new Event("pc-learning-draft"))}catch{}},[key])
 return [value,set]
}
