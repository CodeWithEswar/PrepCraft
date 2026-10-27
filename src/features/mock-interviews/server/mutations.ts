"use server"
import "server-only"
import { resolveWorkspace } from "@/features/workspaces/server"
import { ApplyNextWeekBridgeSchema,FlagMockItemSchema,LaunchMockSessionSchema,SaveMockAnswerSchema,SubmitMockSessionSchema } from "../schemas/mock.schemas"
async function unavailable(slug:string):Promise<never>{const context=await resolveWorkspace(slug);if(!context?.permissions.canView||context.workspace.status!=="active")throw Error("Mock interview access unavailable.");throw Error("Live mock recording is not connected. No session, answer or plan change was saved. Use Practice for recorded sessions.")}
export async function createMockSessionAction(input:unknown){return unavailable(LaunchMockSessionSchema.parse(input).workspaceSlug)}
export async function saveMockAnswerAction(input:unknown){return unavailable(SaveMockAnswerSchema.parse(input).workspaceSlug)}
export async function flagMockItemAction(input:unknown){return unavailable(FlagMockItemSchema.parse(input).workspaceSlug)}
export async function submitMockSessionAction(input:unknown){return unavailable(SubmitMockSessionSchema.parse(input).workspaceSlug)}
export async function applyNextWeekBridgeAction(input:unknown){return unavailable(ApplyNextWeekBridgeSchema.parse(input).workspaceSlug)}
