import type { ExecutionStatus,ExecutionPolicy,ExecutionCommand } from "../types/execution.types"
export function canExecute(status:ExecutionStatus,command:ExecutionCommand["kind"],policy:ExecutionPolicy){
  if(command==="sync")return true
  if(command==="debrief"||command==="debrief_draft")return status==="completed"||status==="expired"
  if(command==="pause")return status==="active"&&policy.pause==="allowed"
  if(command==="resume")return status==="paused"&&policy.pause==="allowed"
  if(command==="finish"||command==="abandon")return ["active","paused"].includes(status)
  if(command==="hint")return status==="active"&&policy.hints!=="forbidden"
  if(command==="phase"||command==="checklist")return status==="active"&&policy.communication
  return status==="active"
}
