"use client"
import { useState } from "react"
import { ExecutionChamber } from "./execution-chamber"
import { ExecutionLobbyPage } from "./execution-lobby"
import { executionPreviewSnapshot } from "../services/preview-snapshot"
import type { ExecutionLobby, ExecutionMode } from "../types/execution.types"

const previewLobby: ExecutionLobby = {
  workspace: { id: "preview", slug: "preview", name: "Execution design preview", timezone: "Asia/Calcutta", userId: "preview-user" },
  active: null,
  recent: [],
  task: null,
  canEdit: true,
  topics: [
    { id: "topic-1", name: "Arrays & Strings" },
    { id: "topic-2", name: "Trees & Graphs" },
    { id: "topic-3", name: "Dynamic Programming" },
  ]
}

export function ExecutionPreview(){
  const [mode,setMode]=useState<ExecutionMode|"debrief"|"setup">("practice")
  return (
    <div className="pc-execution-preview-root">
      <nav className="pc-execution-preview-mode" aria-label="Preview execution modes">
        {(["practice","interview","oa","debrief","setup"] as const).map(value=>(
          <button key={value} aria-pressed={mode===value} onClick={()=>setMode(value)}>
            {value==="setup"?"Session setup":value==="debrief"?"Debrief":value==="oa"?"OA round":value==="interview"?"Interview practice":"Practice"}
          </button>
        ))}
      </nav>
      {mode==="setup" ? (
        <ExecutionLobbyPage lobby={previewLobby} />
      ) : (
        <ExecutionChamber key={mode} preview canEdit={false} snapshot={executionPreviewSnapshot(mode==="debrief"?"practice":mode,mode==="debrief")}/>
      )}
    </div>
  )
}
