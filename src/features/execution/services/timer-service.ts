import type { ExecutionSession } from "../types/execution.types"
import { policyFor } from "./execution-policy"
export function deriveTimer(session:ExecutionSession,serverNow:number){
  const start=Date.parse(session.startedAt),policy=policyFor(session),completed=session.completedAt?Date.parse(session.completedAt):null,paused=session.pausedAt?Date.parse(session.pausedAt):null
  const expiry=session.expiresAt?Date.parse(session.expiresAt):null
  const end=completed??paused??(expiry!==null&&policy.autoFinish?Math.min(serverNow,expiry):serverNow)
  const elapsedMs=Math.max(0,end-start-Math.max(0,session.accumulatedPauseMs)),targetMs=session.targetSeconds===null?null:session.targetSeconds*1000,remainingMs=targetMs===null?null:Math.max(0,targetMs-elapsedMs)
  const expired=policy.autoFinish&&expiry!==null&&serverNow>=expiry&&completed===null
  const seconds=Math.floor((policy.direction==="down"?remainingMs||0:elapsedMs)/1000)
  const threshold=expired||session.status==="expired"?"expired":policy.direction==="up"?"comfortable":seconds<=policy.thresholds.closing?"closing":seconds<=policy.thresholds.attention?"attention":"comfortable"
  return {elapsedMs,remainingMs,expired,threshold,display:formatTimer(seconds),accessible:`${Math.floor(seconds/60)} minutes ${seconds%60} seconds ${policy.direction==="up"?"elapsed":"remaining"}`,targetReached:targetMs!==null&&elapsedMs>=targetMs}
}
export function formatTimer(seconds:number){const safe=Math.max(0,Math.floor(seconds));return safe>=3600?`${Math.floor(safe/3600)}:${String(Math.floor(safe%3600/60)).padStart(2,"0")}:${String(safe%60).padStart(2,"0")}`:`${String(Math.floor(safe/60)).padStart(2,"0")}:${String(safe%60).padStart(2,"0")}`}
/** Advance a server sample with a monotonic clock. Wall-clock changes do not affect the display. */
export function calibratedNow(serverSample:string,receivedAt:number,performanceNow:number,roundTripMs=0){return Date.parse(serverSample)+Math.max(0,Math.min(roundTripMs,10000))/2+Math.max(0,performanceNow-receivedAt)}
export function targetVariance(durationMs:number,targetMs:number|null){if(targetMs===null)return null;const seconds=Math.round(Math.abs(durationMs-targetMs)/1000);return seconds<30?"Around your target":`${formatTimer(seconds)} ${durationMs<targetMs?"under":"over"} target`}
