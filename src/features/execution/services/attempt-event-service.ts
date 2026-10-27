import type { AttemptEvidence,ExecutionSession } from "../types/execution.types"
export function attemptEvent(session:ExecutionSession,attempt:AttemptEvidence){
  if(attempt.reflectionStatus!=="completed"||!attempt.result||attempt.confidence===null)throw new Error("Attempt must be committed before publishing evidence")
  return {type:"attempt.completed" as const,workspaceId:session.workspaceId,attemptId:attempt.id,sessionId:session.id,result:attempt.result,confidence:attempt.confidence,mistakes:attempt.mistakes,completedAt:attempt.completedAt,idempotencyKey:`attempt.completed:${attempt.id}:v1`}
}
/** Consumers own consequences and must deduplicate by event ID/policy before acknowledging. */
export interface AttemptEventConsumer {name:string;consume:(event:ReturnType<typeof attemptEvent>)=>Promise<{applied:boolean}>}
export async function deliverAttemptEvent(event:ReturnType<typeof attemptEvent>,consumer:AttemptEventConsumer,acknowledge:(key:string)=>Promise<void>){await consumer.consume(event);await acknowledge(`${consumer.name}:${event.idempotencyKey}`)}
