"use client"
import { useRef,useState } from "react"
import { useQuery,useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"
import { queryKeys } from "@/lib/query/keys"
import { commandFile,loadFiles } from "./server/actions"
import type { FileSnapshot,PrivateFile } from "./schema"
import "./files.css"
export function FilesPage({initial,enabled,preview=false}:{initial:FileSnapshot;enabled:boolean;preview?:boolean}){
 const [busy,setBusy]=useState<string|null>(null),[message,setMessage]=useState(""),input=useRef<HTMLInputElement>(null),client=useQueryClient(),key=queryKeys.files(initial.workspace.id,initial.workspace.userId)
 const {data,isFetching,error}=useQuery({queryKey:key,queryFn:()=>loadFiles(initial.workspace.slug),initialData:initial,enabled:!preview,refetchInterval:query=>!preview&&query.state.data?.items.some(f=>["PENDING_UPLOAD","DELETING"].includes(f.status))?15000:false})
 const refresh=()=>client.invalidateQueries({queryKey:key,exact:true})
 async function upload(file?:File){if(!file)return;setBusy("upload");setMessage("");try{
  if(file.size>10485760||file.size===0)throw Error("Choose a file between 1 byte and 10 MB.")
  const buffer=await file.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",buffer)),b=>b.toString(16).padStart(2,"0")).join("")
  const grant=await commandFile({slug:initial.workspace.slug,requestId:crypto.randomUUID(),command:{kind:"upload",name:file.name,category:"attachment",mime:file.type||"text/plain",bytes:file.size,checksum:hash}})
  const response=await fetch(grant.workerOrigin+"/files/upload",{method:"PUT",headers:{Authorization:`Bearer ${grant.token}`,"Content-Type":file.type||"text/plain"},body:buffer,signal:AbortSignal.timeout(120000)})
  if(!response.ok)throw Error("The upload was not confirmed. Refresh your files before retrying.")
  setMessage("File verified and saved privately.")
 }catch(error){setMessage(error instanceof Error?error.message:"Upload unavailable.")}finally{setBusy(null);if(input.current)input.current.value="";void refresh()}}
 async function act(file:PrivateFile,kind:"download"|"delete"){
  setBusy(file.id);setMessage("");try{
   const grant=await commandFile({slug:initial.workspace.slug,requestId:crypto.randomUUID(),command:{kind,id:file.id,version:file.version}})
   if(kind==="delete"){setMessage("Deletion requested. Storage cleanup will be confirmed here.");return}
   const response=await fetch(grant.workerOrigin+"/files/download",{headers:{Authorization:`Bearer ${grant.token}`},signal:AbortSignal.timeout(120000)})
   if(!response.ok)throw Error("Download unavailable. Refresh and request a new download.")
   const url=URL.createObjectURL(await response.blob()),a=document.createElement("a");a.href=url;a.download=file.originalName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }catch(error){setMessage(error instanceof Error?error.message:"The operation could not be confirmed.")}finally{setBusy(null);void refresh()}
 }
 return <main className="private-files"><header><div><p className="private-files-eyebrow">YOUR WORKSPACE · PRIVATE STORAGE</p><h1>Files, kept together.</h1><p>Keep your resume and preparation materials within reach.</p></div><Button disabled={!enabled||!data.workspace.canEdit||!!busy} onClick={()=>input.current?.click()}><AppIcon icon="plus"/>Upload file</Button><input ref={input} hidden type="file" accept="application/pdf,image/png,image/jpeg,text/plain" onChange={e=>void upload(e.target.files?.[0])}/></header>
 <section className="private-files-summary"><AppIcon icon="lock"/><div><strong>Only you can access your files.</strong><p>PDF, PNG, JPEG and text · Up to 10 MB per file · 100 MB total</p></div><Button variant="ghost" disabled={isFetching||preview} onClick={()=>void refresh()}>Refresh</Button></section>
 {!enabled&&<p role="status">{preview?"Isolated preview · Sample files below. Uploads and downloads are disabled.":"Private storage is not configured for this environment."}</p>}{(message||error)&&<p role="status" className="private-files-status">{message||"Your files could not refresh. The last confirmed list remains visible."}</p>}
 <section className="private-files-list" aria-label="Private files">{data.items.length===0?<div className="private-files-empty"><AppIcon icon="folder" size="lg"/><h2>A home for your preparation files.</h2><p>Upload a resume, diagram or notes to get started.</p></div>:data.items.map(file=><article key={file.id}><div className="private-file-icon"><AppIcon icon="file"/></div><div className="private-file-info"><h2>{file.name}</h2><p>{(file.bytes/1024).toFixed(0)} KB <span>·</span> {new Date(file.createdAt).toLocaleDateString()}</p></div><span className="private-file-state">{file.status==="READY"?"Verified":file.status==="DELETING"?"Deleting…":file.status==="PENDING_UPLOAD"?"Awaiting upload":file.failureCode==="object_missing"?"File unavailable":"Upload failed"}</span><div className="private-file-actions"><Button size="sm" variant="outline" disabled={preview||file.status!=="READY"||!!busy} onClick={()=>void act(file,"download")}>Download</Button><Button size="sm" variant="ghost" disabled={preview||!data.workspace.canEdit||!!busy||file.status==="DELETING"} onClick={()=>void act(file,"delete")}>Delete</Button></div></article>)}</section>
 {data.cursor&&<Button variant="outline" disabled={!!busy} onClick={async()=>{setBusy("more");try{const page=await loadFiles(initial.workspace.slug,data.cursor);client.setQueryData(key,{...page,items:[...data.items,...page.items]})}catch{setMessage("More files could not be loaded. Retry.")}finally{setBusy(null)}}}>Load more files</Button>}
 </main>
}
