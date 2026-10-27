import {describe,it,expect} from "vitest"
import {executionPreviewSnapshot} from "../services/preview-snapshot"
import {executionPolicy,policyFor} from "../services/execution-policy"
import {deriveTimer,calibratedNow,formatTimer,targetVariance} from "../services/timer-service"
import {canExecute} from "../services/session-state-machine"
import {attemptEvent,deliverAttemptEvent} from "../services/attempt-event-service"
import {launchSchema,executionRequestSchema} from "../schemas/execution.schema"
import {executionKeys} from "../services/query-keys"
import type {AttemptEvidence} from "../types/execution.types"
const start="2026-10-25T00:00:00.000Z",at=(seconds:number)=>Date.parse(start)+seconds*1000
const session=(mode:"practice"|"interview"|"oa"="practice")=>executionPreviewSnapshot(mode).session
describe("authoritative timer mathematics",()=>{
  it("counts up from persisted start",()=>expect(deriveTimer(session(),at(42)).elapsedMs).toBe(42000))
  it("freezes at the authoritative pause timestamp",()=>expect(deriveTimer({...session(),status:"paused",pausedAt:new Date(at(30)).toISOString()},at(90)).elapsedMs).toBe(30000))
  it("subtracts multiple accumulated pauses",()=>expect(deriveTimer({...session(),accumulatedPauseMs:25000},at(90)).elapsedMs).toBe(65000))
  it("keeps completion frozen while reflection happens",()=>expect(deriveTimer({...session(),status:"completed",completedAt:new Date(at(60)).toISOString()},at(300)).elapsedMs).toBe(60000))
  it("derives remaining countdown from the same timestamps",()=>expect(deriveTimer(session("oa"),at(42)).remainingMs).toBe(1758000))
  it("clamps countdown at the deadline after browser sleep",()=>{const clock=deriveTimer(session("oa"),at(4000));expect(clock.remainingMs).toBe(0);expect(clock.elapsedMs).toBe(1800000);expect(clock.expired).toBe(true)})
  it("never auto-finishes a Practice target",()=>{const clock=deriveTimer(session(),at(4000));expect(clock.expired).toBe(false);expect(clock.targetReached).toBe(true);expect(clock.elapsedMs).toBe(4000000)})
  it("uses the monotonic sample, independent of a changed device clock",()=>expect(calibratedNow(start,100,5100,100)).toBe(Date.parse(start)+5050))
  it("does not advance backwards if a sample is earlier than receipt",()=>expect(calibratedNow(start,1000,500)).toBe(Date.parse(start)))
  it.each([[30,"comfortable"],[1200,"attention"],[1750,"closing"],[1800,"expired"]])("exposes semantic countdown thresholds at %s seconds",(seconds,threshold)=>expect(deriveTimer(session("oa"),at(Number(seconds))).threshold).toBe(threshold))
  it("provides a non-live accessible label",()=>expect(deriveTimer(session(),at(78)).accessible).toBe("1 minutes 18 seconds elapsed"))
  it.each([[0,"00:00"],[-2,"00:00"],[65,"01:05"],[3661,"1:01:01"]])("formats %s safely",(seconds,display)=>expect(formatTimer(Number(seconds))).toBe(display))
  it("keeps variance factual without judging correctness",()=>{expect(targetVariance(600000,900000)).toBe("05:00 under target");expect(targetVariance(1000,null)).toBeNull()})
})
describe("mode policies and transitions",()=>{
  it("keeps Behavioral timed practice advisory after the target",()=>{const s={...session(),policyVersion:"behavioral-policy-v1",targetSeconds:120,expiresAt:null};expect(policyFor(s).direction).toBe("down");const timer=deriveTimer(s,at(300));expect(timer.remainingMs).toBe(0);expect(timer.elapsedMs).toBe(300000);expect(timer.expired).toBe(false);expect(timer.targetReached).toBe(true)})
  it("supports relaxed Behavioral practice on the same timestamp timer",()=>{const s={...session(),policyVersion:"behavioral-policy-v1",targetSeconds:null,expiresAt:null};expect(policyFor(s).direction).toBe("up");expect(deriveTimer(s,at(42)).display).toBe("00:42")})
  it("freezes Behavioral practice during a persisted pause",()=>{const s={...session(),policyVersion:"behavioral-policy-v1",targetSeconds:120,expiresAt:null,status:"paused" as const,pausedAt:new Date(at(30)).toISOString()};expect(deriveTimer(s,at(300)).remainingMs).toBe(90000)})
  it("rejects applying Behavioral policy to an OA",()=>expect(()=>executionPolicy("oa","behavioral-policy-v1")).toThrow())
  it("allows explicit Practice pause and resume",()=>{const p=executionPolicy("practice");expect(canExecute("active","pause",p)).toBe(true);expect(canExecute("paused","resume",p)).toBe(true)})
  it.each(["interview","oa"] as const)("rejects pause for %s",mode=>expect(canExecute("active","pause",executionPolicy(mode))).toBe(false))
  it("rejects OA hints",()=>expect(canExecute("active","hint",executionPolicy("oa"))).toBe(false))
  it("limits Interview guidance and communication",()=>{expect(executionPolicy("interview").hintLimit).toBe(2);expect(executionPolicy("interview").communication).toBe(true)})
  it("requires timing to stop before debrief",()=>{expect(canExecute("active","debrief",executionPolicy("practice"))).toBe(false);expect(canExecute("completed","debrief",executionPolicy("practice"))).toBe(true)})
  it("locks working state after expiry",()=>expect(canExecute("expired","draft",executionPolicy("oa"))).toBe(false))
  it("rejects unknown historical policy versions",()=>expect(()=>executionPolicy("oa","unknown")).toThrow())
  it("scopes session query keys by workspace and user",()=>{expect(executionKeys.session("a","u","s")).not.toEqual(executionKeys.session("b","u","s"));expect(executionKeys.session("a","u","s")).not.toEqual(executionKeys.session("a","v","s"))})
})
describe("evidence and event boundaries",()=>{
  const attempt:AttemptEvidence={id:"attempt",itemId:"item",durationMs:1000,targetMs:null,reflectionStatus:"completed",result:"could_not_solve",approach:"Private approach",patternId:null,timeComplexity:"",spaceComplexity:"",confidence:2,mistakes:["edge_case"],notes:"Private reflection",completedAt:start,revisionStatus:"pending"}
  it("publishes only committed evidence",()=>expect(()=>attemptEvent(session(),{...attempt,reflectionStatus:"pending"})).toThrow())
  it("excludes private code and reflection from its event contract",()=>{const value=JSON.stringify(attemptEvent(session(),attempt));expect(value).not.toContain("Private");expect(value).toContain("edge_case")})
  it("does not acknowledge a consumer failure",async()=>{let ack=false;await expect(deliverAttemptEvent(attemptEvent(session(),attempt),{name:"revision",consume:async()=>{throw Error("unavailable")}},async()=>{ack=true})).rejects.toThrow();expect(ack).toBe(false)})
  it("supports idempotent consumer retries without duplicating consequences",async()=>{const applied=new Set<string>();let consequences=0,acks=0;const event=attemptEvent(session(),attempt),consumer={name:"revision",consume:async(value:typeof event)=>{if(applied.has(value.idempotencyKey))return {applied:false};applied.add(value.idempotencyKey);consequences++;return {applied:true}}};for(let i=0;i<2;i++)await deliverAttemptEvent(event,consumer,async()=>{acks++});expect(consequences).toBe(1);expect(acks).toBe(2)})
  it("requires a countdown duration for OA",()=>expect(launchSchema.safeParse({slug:"one",mode:"oa",targetSeconds:null,source:"manual",prompts:[],requestId:crypto.randomUUID()}).success).toBe(false))
  it("rejects empty committed outcomes and confidence",()=>expect(executionRequestSchema.safeParse({slug:"one",sessionId:crypto.randomUUID(),version:0,requestId:crypto.randomUUID(),command:{kind:"debrief",attemptId:crypto.randomUUID(),result:null,confidence:null,approach:"",patternId:null,timeComplexity:"",spaceComplexity:"",mistakes:[],notes:""}}).success).toBe(false))
  it("keeps preview sessions separate for different policies",()=>expect(session("practice").id).not.toBe(session("oa").id))
})
